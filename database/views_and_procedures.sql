-- SARMS: views, functions, procedures, triggers, and extra indexes
-- Run after database/schema.sql  (same database: school_system)
-- Purpose: move reusable joins, validation, and report logic into MySQL.

USE school_system;

-- ===========================================================================
-- EXTRA INDEXES
-- ===========================================================================

-- Speed up approval-status queries (homeroom approval page)
CREATE INDEX idx_marks_approved
    ON marks (approved_by_homeroom);

-- Speed up student name search (LIKE '%name%' still needs full scan,
-- but equality / prefix searches on student_name benefit from this)
CREATE INDEX idx_students_name
    ON students (student_name);

-- Speed up "all marks entered by this teacher" queries
CREATE INDEX idx_marks_teacher
    ON marks (teacher_id);

-- ===========================================================================
-- VIEWS  (reusable joined "virtual tables")
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- v_class_enriched  — class with grade, section, homeroom teacher name
-- Used by: classModel, reportModel (findClassHeader, findRosterClassInfo)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS v_class_enriched;
CREATE VIEW v_class_enriched AS
SELECT
    c.class_id,
    c.grade_id,
    c.section_id,
    c.homeroom_teacher_id,
    g.grade_number,
    sec.section_name,
    t.teacher_name AS homeroom_teacher
FROM classes c
JOIN  grades   g   ON c.grade_id   = g.grade_id
JOIN  sections sec ON c.section_id = sec.section_id
LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id;

-- ---------------------------------------------------------------------------
-- v_student_enriched  — student with grade + section from their class
-- Used by: studentModel (findForAdmin, findById, findByClassId)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS v_student_enriched;
CREATE VIEW v_student_enriched AS
SELECT
    s.student_id,
    s.student_name,
    s.gender,
    s.student_code,
    s.class_id,
    v.grade_number,
    v.section_name
FROM students s
LEFT JOIN v_class_enriched v ON s.class_id = v.class_id;

-- ---------------------------------------------------------------------------
-- v_teacher_full  — teacher with department name and login username
-- Used by: teacherModel (findAllWithUserDept, findById)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS v_teacher_full;
CREATE VIEW v_teacher_full AS
SELECT
    t.teacher_id,
    t.teacher_name,
    t.email,
    t.department_id,
    t.user_id,
    d.department_name,
    u.username,
    u.role
FROM teachers t
LEFT JOIN departments d ON t.department_id = d.department_id
LEFT JOIN users       u ON t.user_id       = u.user_id;

-- ---------------------------------------------------------------------------
-- v_marks_detail  — marks with student name, subject name, teacher name
-- Used by: markModel (findByClass, findSubmittedMarksForClass)
--          reportModel (findRosterStudentRows via LEFT JOIN)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS v_marks_detail;
CREATE VIEW v_marks_detail AS
SELECT
    m.mark_id,
    m.student_id,
    m.subject_id,
    m.teacher_id,
    m.semester_id,
    m.year_id,
    m.mark,
    m.approved_by_homeroom,
    m.approved_by_teacher_id,
    m.approved_at,
    s.student_name,
    s.student_code,
    s.class_id,
    sub.subject_name,
    t.teacher_name
FROM marks m
JOIN  students s  ON m.student_id = s.student_id
JOIN  subjects sub ON m.subject_id = sub.subject_id
LEFT JOIN teachers t ON m.teacher_id = t.teacher_id;

-- ===========================================================================
-- FUNCTIONS
-- ===========================================================================

DROP FUNCTION IF EXISTS fn_student_status;
DELIMITER //
-- fn_student_status(avg_mark)
-- Returns 'PASS', 'FAIL', or 'N/A'.
-- Used by: sp_get_roster_student_summaries, sp_get_class_statistics
CREATE FUNCTION fn_student_status(p_average DECIMAL(6,2))
RETURNS VARCHAR(4)
DETERMINISTIC
BEGIN
    IF p_average IS NULL THEN
        RETURN 'N/A';
    ELSEIF p_average >= 50 THEN
        RETURN 'PASS';
    ELSE
        RETURN 'FAIL';
    END IF;
END //
DELIMITER ;

DROP FUNCTION IF EXISTS fn_pass_percentage;
DELIMITER //
-- fn_pass_percentage(passed, total)
-- Returns the pass-rate as a DECIMAL(5,2) percentage (0.00 – 100.00).
-- Used by: sp_get_class_statistics
CREATE FUNCTION fn_pass_percentage(p_passed INT, p_total INT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    IF p_total IS NULL OR p_total = 0 THEN
        RETURN 0.00;
    END IF;
    RETURN ROUND((p_passed / p_total) * 100, 2);
END //
DELIMITER ;

DROP FUNCTION IF EXISTS fn_student_total;
DELIMITER //
-- fn_student_total(student_id, year_id, semester_id)
-- Returns the sum of all marks for a student in a given term.
-- Used by: sp_get_roster_student_summaries
CREATE FUNCTION fn_student_total(p_student_id INT, p_year_id INT, p_semester_id INT)
RETURNS DECIMAL(8,2)
READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(8,2);
    SELECT COALESCE(SUM(mark), 0)
    INTO   v_total
    FROM   marks
    WHERE  student_id  = p_student_id
      AND  year_id     = p_year_id
      AND  semester_id = p_semester_id;
    RETURN v_total;
END //
DELIMITER ;

DROP FUNCTION IF EXISTS fn_student_average;
DELIMITER //
-- fn_student_average(student_id, year_id, semester_id)
-- Returns the average mark (rounded to 2 decimals) for a student in a given term.
-- Used by: sp_get_roster_student_summaries
CREATE FUNCTION fn_student_average(p_student_id INT, p_year_id INT, p_semester_id INT)
RETURNS DECIMAL(6,2)
READS SQL DATA
BEGIN
    DECLARE v_avg DECIMAL(6,2);
    SELECT COALESCE(ROUND(AVG(mark), 2), 0)
    INTO   v_avg
    FROM   marks
    WHERE  student_id  = p_student_id
      AND  year_id     = p_year_id
      AND  semester_id = p_semester_id;
    RETURN v_avg;
END //
DELIMITER ;

-- ===========================================================================
-- STORED PROCEDURES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- sp_get_roster_student_summaries
-- Returns per-student totals, averages, rank, and PASS/FAIL for a class-term.
-- Uses: fn_student_total, fn_student_average, fn_student_status
-- Used by: reportModel.findRosterStudentSummaries()
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_roster_student_summaries;
DELIMITER //
CREATE PROCEDURE sp_get_roster_student_summaries(
    IN p_class_id    INT,
    IN p_year_id     INT,
    IN p_semester_id INT
)
BEGIN
    SELECT
        s.student_id,
        fn_student_total(s.student_id, p_year_id, p_semester_id)   AS total_marks,
        fn_student_average(s.student_id, p_year_id, p_semester_id) AS average_marks,
        DENSE_RANK() OVER (
            ORDER BY fn_student_total(s.student_id, p_year_id, p_semester_id) DESC
        )                                                           AS class_rank,
        fn_student_status(
            fn_student_average(s.student_id, p_year_id, p_semester_id)
        )                                                           AS status
    FROM students s
    WHERE s.class_id = p_class_id
    ORDER BY s.student_id;
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- sp_get_class_statistics
-- Returns aggregate stats (total, average, passed, failed, pass %) for a class-term.
-- Used by: reportModel.getClassStatisticsRow()
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_class_statistics;
DELIMITER //
CREATE PROCEDURE sp_get_class_statistics(
    IN p_class_id    INT,
    IN p_year_id     INT,
    IN p_semester_id INT
)
BEGIN
    SELECT
        COUNT(DISTINCT s.student_id) AS total_students,
        ROUND(AVG(
            (SELECT SUM(m2.mark) FROM marks m2
             WHERE m2.student_id = s.student_id
               AND m2.year_id     = p_year_id
               AND m2.semester_id = p_semester_id)
        ), 2) AS class_average_total,
        SUM(CASE
            WHEN fn_student_status(
                (SELECT AVG(m3.mark) FROM marks m3
                 WHERE m3.student_id = s.student_id
                   AND m3.year_id     = p_year_id
                   AND m3.semester_id = p_semester_id)
            ) = 'PASS' THEN 1 ELSE 0
        END) AS passed_count,
        SUM(CASE
            WHEN fn_student_status(
                (SELECT AVG(m4.mark) FROM marks m4
                 WHERE m4.student_id = s.student_id
                   AND m4.year_id     = p_year_id
                   AND m4.semester_id = p_semester_id)
            ) = 'FAIL' THEN 1 ELSE 0
        END) AS failed_count,
        fn_pass_percentage(
            SUM(CASE
                WHEN fn_student_status(
                    (SELECT AVG(m5.mark) FROM marks m5
                     WHERE m5.student_id = s.student_id
                       AND m5.year_id     = p_year_id
                       AND m5.semester_id = p_semester_id)
                ) = 'PASS' THEN 1 ELSE 0
            END),
            COUNT(DISTINCT s.student_id)
        ) AS pass_percentage
    FROM students s
    WHERE s.class_id = p_class_id;
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- sp_homeroom_summary
-- Returns per-subject submission progress for a homeroom class-term.
-- Used by: markModel.homeroomSummaryForClass()
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_homeroom_summary;
DELIMITER //
CREATE PROCEDURE sp_homeroom_summary(
    IN p_class_id    INT,
    IN p_year_id     INT,
    IN p_semester_id INT
)
BEGIN
    SELECT
        sub.subject_id,
        sub.subject_name,
        t.teacher_name,
        COALESCE(cnt.c, 0)                                          AS submitted_count,
        (SELECT COUNT(*) FROM students WHERE class_id = p_class_id) AS total_students
    FROM teacher_assignments ta
    JOIN subjects sub ON ta.subject_id = sub.subject_id
    JOIN teachers  t  ON ta.teacher_id = t.teacher_id
    LEFT JOIN (
        SELECT m.subject_id, COUNT(*) AS c
        FROM marks m
        JOIN students s ON m.student_id = s.student_id
        WHERE s.class_id   = p_class_id
          AND m.year_id     = p_year_id
          AND m.semester_id = p_semester_id
        GROUP BY m.subject_id
    ) cnt ON sub.subject_id = cnt.subject_id
    WHERE ta.class_id = p_class_id
      AND ta.year_id  = p_year_id
    ORDER BY sub.subject_name;
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- sp_approve_class_marks
-- Bulk-approves all marks for a class-term and returns the count updated.
-- Used by: markModel.approveMarksForClassTerm()
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_approve_class_marks;
DELIMITER //
CREATE PROCEDURE sp_approve_class_marks(
    IN  p_class_id          INT,
    IN  p_year_id           INT,
    IN  p_semester_id       INT,
    IN  p_approver_teacher  INT,
    OUT p_updated_count     INT
)
BEGIN
    UPDATE marks m
    JOIN students s ON m.student_id = s.student_id
    SET
        m.approved_by_homeroom    = 1,
        m.approved_by_teacher_id  = p_approver_teacher,
        m.approved_at             = NOW()
    WHERE s.class_id   = p_class_id
      AND m.year_id     = p_year_id
      AND m.semester_id = p_semester_id;

    SET p_updated_count = ROW_COUNT();
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- sp_delete_marks_class_term
-- Deletes all marks for a class-term (called after roster is generated).
-- Used by: reportModel.deleteMarksForClassTerm()
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_delete_marks_class_term;
DELIMITER //
CREATE PROCEDURE sp_delete_marks_class_term(
    IN  p_class_id    INT,
    IN  p_year_id     INT,
    IN  p_semester_id INT,
    OUT p_deleted     INT
)
BEGIN
    DELETE m FROM marks m
    INNER JOIN students s ON s.student_id = m.student_id
    WHERE s.class_id   = p_class_id
      AND m.year_id     = p_year_id
      AND m.semester_id = p_semester_id;

    SET p_deleted = ROW_COUNT();
END //
DELIMITER ;

-- ===========================================================================
-- TRIGGERS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- trg_mark_insert_range
-- Prevents inserting a mark outside 0-100 at the DB level.
-- Fires on: INSERT into marks
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_mark_insert_range;
DELIMITER //
CREATE TRIGGER trg_mark_insert_range
BEFORE INSERT ON marks
FOR EACH ROW
BEGIN
    IF NEW.mark IS NOT NULL AND (NEW.mark < 0 OR NEW.mark > 100) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Mark must be between 0 and 100';
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- trg_mark_update_range
-- Prevents updating a mark to a value outside 0-100 at the DB level.
-- Fires on: UPDATE marks
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_mark_update_range;
DELIMITER //
CREATE TRIGGER trg_mark_update_range
BEFORE UPDATE ON marks
FOR EACH ROW
BEGIN
    IF NEW.mark IS NOT NULL AND (NEW.mark < 0 OR NEW.mark > 100) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Mark must be between 0 and 100';
    END IF;
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- trg_mark_reset_approval
-- When a teacher edits an already-approved mark, automatically resets the
-- approval so the homeroom teacher must re-approve.
-- Fires on: UPDATE marks (only when mark value actually changes)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_mark_reset_approval;
DELIMITER //
CREATE TRIGGER trg_mark_reset_approval
BEFORE UPDATE ON marks
FOR EACH ROW
BEGIN
    IF NEW.mark <> OLD.mark AND OLD.approved_by_homeroom = 1 THEN
        SET NEW.approved_by_homeroom   = 0;
        SET NEW.approved_by_teacher_id = NULL;
        SET NEW.approved_at            = NULL;
    END IF;
END //
DELIMITER ;

-- ===========================================================================
-- AUDIT LOG TRIGGERS  (write to marks_log table)
-- Fire automatically on every INSERT / UPDATE / DELETE on marks.
-- No backend code changes needed.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- after_mark_insert
-- Logs every new mark entry into marks_log.
-- Fires on: AFTER INSERT on marks
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS after_mark_insert;
DELIMITER //
CREATE TRIGGER after_mark_insert
AFTER INSERT ON marks
FOR EACH ROW
BEGIN
    INSERT INTO marks_log (mark_id, student_id, subject_id, teacher_id,
                           year_id, semester_id, old_mark, new_mark, action)
    VALUES (NEW.mark_id, NEW.student_id, NEW.subject_id, NEW.teacher_id,
            NEW.year_id, NEW.semester_id, NULL, NEW.mark, 'INSERT');
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- after_mark_update
-- Logs every mark edit — records old value and new value.
-- Fires on: AFTER UPDATE on marks
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS after_mark_update;
DELIMITER //
CREATE TRIGGER after_mark_update
AFTER UPDATE ON marks
FOR EACH ROW
BEGIN
    INSERT INTO marks_log (mark_id, student_id, subject_id, teacher_id,
                           year_id, semester_id, old_mark, new_mark, action)
    VALUES (NEW.mark_id, NEW.student_id, NEW.subject_id, NEW.teacher_id,
            NEW.year_id, NEW.semester_id, OLD.mark, NEW.mark, 'UPDATE');
END //
DELIMITER ;

-- ---------------------------------------------------------------------------
-- after_mark_delete
-- Logs every mark deletion — records the value before it was removed.
-- Fires on: AFTER DELETE on marks
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS after_mark_delete;
DELIMITER //
CREATE TRIGGER after_mark_delete
AFTER DELETE ON marks
FOR EACH ROW
BEGIN
    INSERT INTO marks_log (mark_id, student_id, subject_id, teacher_id,
                           year_id, semester_id, old_mark, new_mark, action)
    VALUES (OLD.mark_id, OLD.student_id, OLD.subject_id, OLD.teacher_id,
            OLD.year_id, OLD.semester_id, OLD.mark, NULL, 'DELETE');
END //
DELIMITER ;

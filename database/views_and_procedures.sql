-- SARMS: views and stored procedures
-- Run after database/schema.sql (same database: school_system)
-- Purpose: move reusable joins and report logic into MySQL so the API stays thin.

USE school_system;

-- ---------------------------------------------------------------------------
-- VIEWS (reusable joined "virtual tables")
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
JOIN grades g ON c.grade_id = g.grade_id
JOIN sections sec ON c.section_id = sec.section_id
LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id;

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
-- PROCEDURES (parameterized operations + report queries)
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_get_roster_student_summaries;
DELIMITER //
CREATE PROCEDURE sp_get_roster_student_summaries(
    IN p_class_id INT,
    IN p_year_id INT,
    IN p_semester_id INT
)
BEGIN
    SELECT
        x.student_id,
        x.total_marks,
        x.average_marks,
        DENSE_RANK() OVER (ORDER BY x.total_marks DESC) AS class_rank,
        CASE
            WHEN x.average_marks >= 50 THEN 'PASS'
            ELSE 'FAIL'
        END AS status
    FROM (
        SELECT
            s.student_id,
            COALESCE(SUM(m.mark), 0) AS total_marks,
            COALESCE(ROUND(AVG(m.mark), 2), 0) AS average_marks
        FROM students s
        LEFT JOIN marks m
            ON m.student_id = s.student_id
            AND m.year_id = p_year_id
            AND m.semester_id = p_semester_id
        WHERE s.class_id = p_class_id
        GROUP BY s.student_id
    ) x
    ORDER BY x.student_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_class_statistics;
DELIMITER //
CREATE PROCEDURE sp_get_class_statistics(
    IN p_class_id INT,
    IN p_year_id INT,
    IN p_semester_id INT
)
BEGIN
    SELECT
        COUNT(DISTINCT s.student_id) AS total_students,
        AVG(
            (SELECT SUM(m2.mark)
             FROM marks m2
             WHERE m2.student_id = s.student_id
               AND m2.year_id = p_year_id
               AND m2.semester_id = p_semester_id)
        ) AS class_average_total,
        SUM(CASE
            WHEN (SELECT AVG(m3.mark)
                  FROM marks m3
                  WHERE m3.student_id = s.student_id
                    AND m3.year_id = p_year_id
                    AND m3.semester_id = p_semester_id) >= 50
            THEN 1 ELSE 0
        END) AS passed_count,
        SUM(CASE
            WHEN (SELECT AVG(m4.mark)
                  FROM marks m4
                  WHERE m4.student_id = s.student_id
                    AND m4.year_id = p_year_id
                    AND m4.semester_id = p_semester_id) < 50
            THEN 1 ELSE 0
        END) AS failed_count
    FROM students s
    WHERE s.class_id = p_class_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_delete_marks_class_term;
DELIMITER //
CREATE PROCEDURE sp_delete_marks_class_term(
    IN p_class_id INT,
    IN p_year_id INT,
    IN p_semester_id INT
)
BEGIN
    DELETE m FROM marks m
    INNER JOIN students s ON s.student_id = m.student_id
    WHERE s.class_id = p_class_id
      AND m.year_id = p_year_id
      AND m.semester_id = p_semester_id;
    SELECT ROW_COUNT() AS deleted_count;
END //
DELIMITER ;

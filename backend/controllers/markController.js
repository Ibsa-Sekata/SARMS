const db = require('../config/db');

// Get all marks (with filters)
const getMarks = async (req, res) => {
    try {
        const { student_id, class_id, subject_id, year_id = 2, semester_id = 1, status } = req.query;
        const user = req.user;

        let sql = `
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                m.status,
                m.submitted_at,
                m.recorded_date,
                s.student_name,
                sub.subject_name,
                t.teacher_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE m.year_id = ? AND m.semester_id = ?
        `;

        const params = [year_id, semester_id];

        // For homeroom teachers, show only submitted marks
        // For subject teachers, show their own marks (draft or submitted)
        // For admin, show all marks
        if (user.role !== 'admin') {
            // Check if user is homeroom teacher
            const [homeroomClass] = await db.execute(
                'SELECT class_id FROM classes WHERE homeroom_teacher_id = ?',
                [user.teacher_id]
            );

            if (homeroomClass.length > 0) {
                // Homeroom teacher - show only submitted marks for their class
                sql += ' AND s.class_id = ? AND m.status = ?';
                params.push(homeroomClass[0].class_id, 'submitted');
            } else {
                // Subject teacher - show only their own marks
                sql += ' AND m.teacher_id = ?';
                params.push(user.teacher_id);
            }
        }

        if (student_id) {
            sql += ' AND m.student_id = ?';
            params.push(student_id);
        }

        if (subject_id) {
            sql += ' AND m.subject_id = ?';
            params.push(subject_id);
        }

        if (class_id) {
            sql += ' AND s.class_id = ?';
            params.push(class_id);
        }

        if (status) {
            sql += ' AND m.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY s.student_name, sub.subject_name';

        const [marks] = await db.execute(sql, params);

        res.json({
            success: true,
            marks: marks
        });

    } catch (error) {
        console.error('Error getting marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marks',
            error: error.message
        });
    }
};

// Get marks by class
const getMarksByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        const [marks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                m.recorded_date,
                s.student_name,
                sub.subject_name,
                t.teacher_name
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE s.class_id = ? AND m.year_id = ? AND m.semester_id = ?
            ORDER BY s.student_name, sub.subject_name
        `, [classId, year_id, semester_id]);

        res.json({
            success: true,
            marks: marks
        });

    } catch (error) {
        console.error('Error getting marks by class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marks',
            error: error.message
        });
    }
};

// Create new mark (with access control) - saves as draft
const createMark = async (req, res) => {
    try {
        const { student_id, subject_id, teacher_id, semester_id, year_id, mark } = req.body;
        const user = req.user;

        console.log('Creating mark:', { student_id, subject_id, teacher_id, user: user.teacher_id });

        // Validation
        if (!student_id || !subject_id || !teacher_id || !semester_id || !year_id || mark === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (mark < 0 || mark > 100) {
            return res.status(400).json({
                success: false,
                message: 'Mark must be between 0 and 100'
            });
        }

        // Check if teacher is assigned to teach this subject to this student's class
        if (user.role !== 'admin') {
            const [student] = await db.execute(
                'SELECT class_id FROM students WHERE student_id = ?',
                [student_id]
            );

            if (student.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            const [assignments] = await db.execute(`
                SELECT assignment_id 
                FROM teacher_assignments 
                WHERE teacher_id = ? AND subject_id = ? AND class_id = ? AND year_id = ?
            `, [user.teacher_id, subject_id, student[0].class_id, year_id]);

            if (assignments.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to teach this subject to this class'
                });
            }
        }

        // Save mark as draft (can be edited later)
        const [result] = await db.execute(`
            INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark, status)
            VALUES (?, ?, ?, ?, ?, ?, 'draft')
            ON DUPLICATE KEY UPDATE mark = ?, teacher_id = ?, status = 'draft', updated_at = CURRENT_TIMESTAMP
        `, [student_id, subject_id, teacher_id, semester_id, year_id, mark, mark, teacher_id]);

        res.status(201).json({
            success: true,
            message: 'Mark saved as draft',
            mark_id: result.insertId || result.affectedRows
        });

    } catch (error) {
        console.error('Error creating mark:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to save mark',
            error: error.message
        });
    }
};

// Update mark
const updateMark = async (req, res) => {
    try {
        const { id } = req.params;
        const { mark } = req.body;

        if (mark < 0 || mark > 100) {
            return res.status(400).json({
                success: false,
                message: 'Mark must be between 0 and 100'
            });
        }

        const [result] = await db.execute(`
            UPDATE marks 
            SET mark = ?
            WHERE mark_id = ?
        `, [mark, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mark not found'
            });
        }

        res.json({
            success: true,
            message: 'Mark updated successfully'
        });

    } catch (error) {
        console.error('Error updating mark:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mark',
            error: error.message
        });
    }
};

// Delete mark
const deleteMark = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute('DELETE FROM marks WHERE mark_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mark not found'
            });
        }

        res.json({
            success: true,
            message: 'Mark deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting mark:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete mark',
            error: error.message
        });
    }
};

// Batch submit marks (with access control)
const submitMarks = async (req, res) => {
    try {
        const { marks } = req.body;
        const user = req.user;

        console.log(`Submitting ${marks?.length} marks for user:`, user.teacher_id);

        if (!marks || !Array.isArray(marks) || marks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Marks array is required'
            });
        }

        // Validate all marks
        for (const mark of marks) {
            if (mark.mark < 0 || mark.mark > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'All marks must be between 0 and 100'
                });
            }
        }

        // Check teacher access for each mark (if not admin)
        if (user.role !== 'admin') {
            for (const mark of marks) {
                const [student] = await db.execute(
                    'SELECT class_id FROM students WHERE student_id = ?',
                    [mark.student_id]
                );

                if (student.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: `Student ${mark.student_id} not found`
                    });
                }

                const [assignments] = await db.execute(`
                    SELECT assignment_id 
                    FROM teacher_assignments 
                    WHERE teacher_id = ? AND subject_id = ? AND class_id = ? AND year_id = ?
                `, [user.teacher_id, mark.subject_id, student[0].class_id, mark.year_id]);

                if (assignments.length === 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not assigned to teach this subject to this class'
                    });
                }
            }
        }

        // Insert/update all marks as draft
        let successCount = 0;
        for (const mark of marks) {
            await db.execute(`
                INSERT INTO marks (student_id, subject_id, teacher_id, semester_id, year_id, mark, status)
                VALUES (?, ?, ?, ?, ?, ?, 'draft')
                ON DUPLICATE KEY UPDATE mark = ?, teacher_id = ?, status = 'draft', updated_at = CURRENT_TIMESTAMP
            `, [mark.student_id, mark.subject_id, mark.teacher_id, mark.semester_id, mark.year_id, mark.mark, mark.mark, mark.teacher_id]);
            successCount++;
        }

        res.status(201).json({
            success: true,
            message: `${successCount} marks saved as draft`
        });

    } catch (error) {
        console.error('Error submitting marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit marks',
            error: error.message
        });
    }
};

// Submit marks to homeroom teacher (change status from draft to submitted)
const submitToHomeroom = async (req, res) => {
    try {
        const { class_id, subject_id, year_id, semester_id } = req.body;
        const user = req.user;

        console.log('Submitting marks to homeroom:', { class_id, subject_id, year_id, semester_id, teacher: user.teacher_id });

        // Validation
        if (!class_id || !subject_id || !year_id || !semester_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, subject, year, and semester are required'
            });
        }

        // Check if teacher is assigned to this class/subject
        if (user.role !== 'admin') {
            const [assignments] = await db.execute(`
                SELECT assignment_id 
                FROM teacher_assignments 
                WHERE teacher_id = ? AND subject_id = ? AND class_id = ? AND year_id = ?
            `, [user.teacher_id, subject_id, class_id, year_id]);

            if (assignments.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to teach this subject to this class'
                });
            }
        }

        // Get all students in this class
        const [students] = await db.execute(
            'SELECT student_id FROM students WHERE class_id = ?',
            [class_id]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found in this class'
            });
        }

        // Update all marks for this class/subject to 'submitted' status
        const [result] = await db.execute(`
            UPDATE marks 
            SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
            WHERE teacher_id = ? 
              AND subject_id = ? 
              AND year_id = ? 
              AND semester_id = ?
              AND student_id IN (SELECT student_id FROM students WHERE class_id = ?)
              AND status = 'draft'
        `, [user.teacher_id, subject_id, year_id, semester_id, class_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'No draft marks found to submit. Please enter marks first.'
            });
        }

        res.json({
            success: true,
            message: `${result.affectedRows} marks submitted to homeroom teacher`,
            submitted_count: result.affectedRows
        });

    } catch (error) {
        console.error('Error submitting to homeroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit marks to homeroom teacher',
            error: error.message
        });
    }
};

// Get all submitted marks for homeroom teacher's class
const getSubmittedMarksForHomeroom = async (req, res) => {
    try {
        const user = req.user;
        const { year_id, semester_id } = req.query;

        console.log('Getting submitted marks for homeroom teacher:', user.teacher_id, 'year:', year_id, 'semester:', semester_id);

        // Get homeroom teacher's class
        const [classes] = await db.execute(`
            SELECT class_id, grade_id, section_id
            FROM classes
            WHERE homeroom_teacher_id = ?
        `, [user.teacher_id]);

        if (classes.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a homeroom teacher'
            });
        }

        const classId = classes[0].class_id;
        console.log('Homeroom class ID:', classId);

        // Get all submitted marks for this class
        const [marks] = await db.execute(`
            SELECT 
                m.mark_id,
                m.student_id,
                m.subject_id,
                m.teacher_id,
                m.mark,
                m.status,
                m.submitted_at,
                s.student_name,
                s.student_code,
                sub.subject_name,
                t.teacher_name,
                t.teacher_id as subject_teacher_id
            FROM marks m
            JOIN students s ON m.student_id = s.student_id
            JOIN subjects sub ON m.subject_id = sub.subject_id
            JOIN teachers t ON m.teacher_id = t.teacher_id
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND m.status = 'submitted'
            ORDER BY sub.subject_name, s.student_name
        `, [classId, year_id, semester_id]);

        console.log('Found submitted marks:', marks.length);

        // Get summary of ALL subjects assigned to this class (not just those with submitted marks)
        const [summary] = await db.execute(`
            SELECT 
                sub.subject_id,
                sub.subject_name,
                t.teacher_name,
                COALESCE(submitted.count, 0) as submitted_count,
                (SELECT COUNT(*) FROM students WHERE class_id = ?) as total_students
            FROM teacher_assignments ta
            JOIN subjects sub ON ta.subject_id = sub.subject_id
            JOIN teachers t ON ta.teacher_id = t.teacher_id
            LEFT JOIN (
                SELECT subject_id, COUNT(*) as count
                FROM marks m
                JOIN students s ON m.student_id = s.student_id
                WHERE s.class_id = ?
                  AND m.year_id = ?
                  AND m.semester_id = ?
                  AND m.status = 'submitted'
                GROUP BY subject_id
            ) submitted ON sub.subject_id = submitted.subject_id
            WHERE ta.class_id = ? AND ta.year_id = ?
            ORDER BY sub.subject_name
        `, [classId, classId, year_id, semester_id, classId, year_id]);

        console.log('Summary:', summary.length, 'subjects with submitted marks');

        res.json({
            success: true,
            class_id: classId,
            marks: marks,
            summary: summary
        });

    } catch (error) {
        console.error('Error getting submitted marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get submitted marks',
            error: error.message
        });
    }
};

// Approve all submitted marks for homeroom teacher's class
const approveAllMarks = async (req, res) => {
    try {
        const user = req.user;
        const { year_id, semester_id } = req.body;

        // Get homeroom teacher's class
        const [classes] = await db.execute(`
            SELECT class_id
            FROM classes
            WHERE homeroom_teacher_id = ?
        `, [user.teacher_id]);

        if (classes.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a homeroom teacher'
            });
        }

        const classId = classes[0].class_id;

        // Get total number of students in the class
        const [studentCount] = await db.execute(
            'SELECT COUNT(*) as total FROM students WHERE class_id = ?',
            [classId]
        );
        const totalStudents = studentCount[0].total;

        // Get all subjects assigned to this class
        const [assignedSubjects] = await db.execute(`
            SELECT DISTINCT ta.subject_id, s.subject_name
            FROM teacher_assignments ta
            JOIN subjects s ON ta.subject_id = s.subject_id
            WHERE ta.class_id = ? AND ta.year_id = ?
        `, [classId, year_id]);

        if (assignedSubjects.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No subjects assigned to this class'
            });
        }

        // Check if all subjects have submitted marks for all students
        const [submissionStatus] = await db.execute(`
            SELECT 
                sub.subject_id,
                sub.subject_name,
                COUNT(m.mark_id) as submitted_count
            FROM subjects sub
            JOIN teacher_assignments ta ON sub.subject_id = ta.subject_id
            LEFT JOIN marks m ON sub.subject_id = m.subject_id 
                AND m.year_id = ?
                AND m.semester_id = ?
                AND m.status = 'submitted'
                AND m.student_id IN (SELECT student_id FROM students WHERE class_id = ?)
            WHERE ta.class_id = ? AND ta.year_id = ?
            GROUP BY sub.subject_id, sub.subject_name
        `, [year_id, semester_id, classId, classId, year_id]);

        // Validate that all subjects have marks for all students
        const incompleteSubjects = submissionStatus.filter(
            subject => subject.submitted_count < totalStudents
        );

        if (incompleteSubjects.length > 0) {
            const missingInfo = incompleteSubjects.map(s =>
                `${s.subject_name} (${s.submitted_count}/${totalStudents} students)`
            ).join(', ');

            return res.status(400).json({
                success: false,
                message: `Cannot approve marks. Not all teachers have submitted marks for all students. Missing: ${missingInfo}`
            });
        }

        // Update all submitted marks to 'approved' status
        const [result] = await db.execute(`
            UPDATE marks m
            JOIN students s ON m.student_id = s.student_id
            SET m.status = 'approved', m.approved_at = CURRENT_TIMESTAMP
            WHERE s.class_id = ?
              AND m.year_id = ?
              AND m.semester_id = ?
              AND m.status = 'submitted'
        `, [classId, year_id, semester_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'No submitted marks found to approve'
            });
        }

        res.json({
            success: true,
            message: `${result.affectedRows} marks approved successfully`,
            approved_count: result.affectedRows
        });

    } catch (error) {
        console.error('Error approving marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve marks',
            error: error.message
        });
    }
};

module.exports = {
    getMarks,
    createMark,
    updateMark,
    deleteMark,
    submitMarks,
    getMarksByClass,
    submitToHomeroom,
    getSubmittedMarksForHomeroom,
    approveAllMarks
};

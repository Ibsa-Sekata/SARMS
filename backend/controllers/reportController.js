const db = require('../config/db');

// Generate individual student report
const generateStudentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        // Get student information
        const [students] = await db.execute(`
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                c.class_id,
                g.grade_number,
                sec.section_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.class_id
            LEFT JOIN grades g ON c.grade_id = g.grade_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            WHERE s.student_id = ?
        `, [id]);

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];

        // Get all marks for the student
        const [marks] = await db.execute(`
            SELECT 
                sub.subject_name,
                m.mark
            FROM marks m
            JOIN subjects sub ON m.subject_id = sub.subject_id
            WHERE m.student_id = ? 
                AND m.year_id = ? 
                AND m.semester_id = ?
            ORDER BY sub.subject_name
        `, [id, year_id, semester_id]);

        // Calculate totals and averages
        const totalScore = marks.reduce((sum, mark) => sum + (mark.mark || 0), 0);
        const maxTotal = marks.length * 100;
        const average = marks.length > 0 ? totalScore / marks.length : 0;
        const status = average >= 50 ? 'PASS' : 'FAIL';

        res.json({
            success: true,
            student: student,
            marks: marks,
            summary: {
                total: totalScore,
                max_total: maxTotal,
                average: average.toFixed(2),
                status: status
            }
        });

    } catch (error) {
        console.error('Error generating student report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate student report',
            error: error.message
        });
    }
};

// Generate reports for all students in a class
const generateClassReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        // Get class information
        const [classInfo] = await db.execute(`
            SELECT 
                c.class_id,
                g.grade_number,
                sec.section_name,
                t.teacher_name as homeroom_teacher
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            WHERE c.class_id = ?
        `, [id]);

        if (classInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get all students with their marks
        const [students] = await db.execute(`
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                GROUP_CONCAT(
                    CONCAT(sub.subject_name, ':', COALESCE(m.mark, 0))
                    ORDER BY sub.subject_name
                    SEPARATOR '|'
                ) as marks_data
            FROM students s
            LEFT JOIN marks m ON s.student_id = m.student_id 
                AND m.year_id = ? 
                AND m.semester_id = ?
            LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
            WHERE s.class_id = ?
            GROUP BY s.student_id, s.student_name, s.gender, s.student_code
            ORDER BY s.student_name
        `, [year_id, semester_id, id]);

        // Process student data
        const processedStudents = students.map(student => {
            const marks = {};
            let total = 0;

            if (student.marks_data) {
                student.marks_data.split('|').forEach(mark => {
                    const [subject, score] = mark.split(':');
                    const scoreNum = parseInt(score) || 0;
                    marks[subject] = scoreNum;
                    total += scoreNum;
                });
            }

            const subjectCount = Object.keys(marks).length || 5;
            const average = total / subjectCount;
            const status = average >= 50 ? 'PASS' : 'FAIL';

            return {
                student_id: student.student_id,
                student_name: student.student_name,
                gender: student.gender,
                student_code: student.student_code,
                marks: marks,
                total: total,
                average: average.toFixed(2),
                status: status
            };
        });

        // Sort by total for ranking
        processedStudents.sort((a, b) => b.total - a.total);

        // Assign ranks
        let currentRank = 1;
        processedStudents.forEach((student, index) => {
            if (index > 0 && student.total < processedStudents[index - 1].total) {
                currentRank = index + 1;
            }
            student.rank = currentRank;
        });

        res.json({
            success: true,
            class_info: classInfo[0],
            students: processedStudents,
            total_students: processedStudents.length,
            passed: processedStudents.filter(s => s.status === 'PASS').length,
            failed: processedStudents.filter(s => s.status === 'FAIL').length
        });

    } catch (error) {
        console.error('Error generating class report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate class report',
            error: error.message
        });
    }
};

// Generate student roster for a class
const generateStudentRoster = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        console.log('Generating roster for:', { classId, year_id, semester_id });

        // Get class information with homeroom teacher
        const [classInfo] = await db.execute(`
            SELECT 
                c.class_id,
                g.grade_number,
                sec.section_name,
                t.teacher_name as homeroom_teacher,
                ay.year_name,
                sem.semester_name
            FROM classes c
            JOIN grades g ON c.grade_id = g.grade_id
            JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.teacher_id
            LEFT JOIN academic_years ay ON ay.year_id = ?
            LEFT JOIN semesters sem ON sem.semester_id = ?
            WHERE c.class_id = ?
        `, [year_id, semester_id, classId]);

        if (classInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get all students in the class with their APPROVED marks only
        const [students] = await db.execute(`
            SELECT 
                s.student_id,
                s.student_name,
                s.gender,
                s.student_code,
                MAX(CASE WHEN sub.subject_name = 'Mathematics' THEN m.mark END) as maths,
                MAX(CASE WHEN sub.subject_name = 'English' THEN m.mark END) as eng,
                MAX(CASE WHEN sub.subject_name = 'Biology' THEN m.mark END) as bio,
                MAX(CASE WHEN sub.subject_name = 'Chemistry' THEN m.mark END) as chem,
                MAX(CASE WHEN sub.subject_name = 'Physics' THEN m.mark END) as phy
            FROM students s
            LEFT JOIN marks m ON s.student_id = m.student_id 
                AND m.year_id = ? 
                AND m.semester_id = ?
                AND m.status = 'approved'
            LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
            WHERE s.class_id = ?
            GROUP BY s.student_id, s.student_name, s.gender, s.student_code
            ORDER BY s.student_name
        `, [year_id, semester_id, classId]);

        // Calculate totals, averages, and rankings
        const studentsWithCalculations = students.map(student => {
            const marks = {
                maths: student.maths || 0,
                eng: student.eng || 0,
                bio: student.bio || 0,
                chem: student.chem || 0,
                phy: student.phy || 0
            };

            const total = marks.maths + marks.eng + marks.bio + marks.chem + marks.phy;
            const average = total / 5;
            const status = average >= 50 ? 'PASS' : 'FAIL';

            return {
                student_id: student.student_id,
                student_name: student.student_name,
                gender: student.gender,
                student_code: student.student_code,
                marks,
                total,
                average: average.toFixed(1),
                status
            };
        });

        // Sort by total marks (descending) for ranking
        studentsWithCalculations.sort((a, b) => b.total - a.total);

        // Assign ranks (handle ties)
        let currentRank = 1;
        studentsWithCalculations.forEach((student, index) => {
            if (index > 0 && student.total < studentsWithCalculations[index - 1].total) {
                currentRank = index + 1;
            }
            student.rank = currentRank;
        });

        // Sort back to alphabetical order for display
        studentsWithCalculations.sort((a, b) => a.student_name.localeCompare(b.student_name));

        const response = {
            success: true,
            class_info: classInfo[0],
            students: studentsWithCalculations,
            total_students: studentsWithCalculations.length,
            passed_students: studentsWithCalculations.filter(s => s.status === 'PASS').length,
            failed_students: studentsWithCalculations.filter(s => s.status === 'FAIL').length
        };

        console.log('Roster generated successfully:', {
            class: classInfo[0],
            studentCount: studentsWithCalculations.length
        });

        res.json(response);

    } catch (error) {
        console.error('Error generating student roster:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate student roster',
            error: error.message
        });
    }
};

// Get class statistics
const getClassStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Class ID is required'
            });
        }

        // Get class performance statistics using SQL aggregation
        const [stats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT s.student_id) as total_students,
                AVG(
                    (SELECT SUM(m2.mark) 
                     FROM marks m2 
                     WHERE m2.student_id = s.student_id 
                       AND m2.year_id = ? 
                       AND m2.semester_id = ?)
                ) as class_average_total,
                SUM(CASE 
                    WHEN (SELECT AVG(m3.mark) 
                          FROM marks m3 
                          WHERE m3.student_id = s.student_id 
                            AND m3.year_id = ? 
                            AND m3.semester_id = ?) >= 50 
                    THEN 1 ELSE 0 
                END) as passed_count,
                SUM(CASE 
                    WHEN (SELECT AVG(m4.mark) 
                          FROM marks m4 
                          WHERE m4.student_id = s.student_id 
                            AND m4.year_id = ? 
                            AND m4.semester_id = ?) < 50 
                    THEN 1 ELSE 0 
                END) as failed_count
            FROM students s
            WHERE s.class_id = ?
        `, [year_id, semester_id, year_id, semester_id, year_id, semester_id, id]);

        res.json({
            success: true,
            statistics: {
                total_students: stats[0].total_students || 0,
                class_average: stats[0].class_average_total || 0,
                passed_count: stats[0].passed_count || 0,
                failed_count: stats[0].failed_count || 0
            }
        });

    } catch (error) {
        console.error('Error getting class statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get class statistics',
            error: error.message
        });
    }
};

module.exports = {
    generateStudentReport,
    generateClassReport,
    generateStudentRoster,
    getClassStatistics
};

const reportModel = require('../models/reportModel');
const markModel = require('../models/markModel');
const reportService = require('../services/reportService')
// Shared: build roster from views (no snapshot table needed)
async function buildRosterResponse(classId, year_id, semester_id) {
    const classInfo = await reportModel.findRosterClassInfo(classId, year_id, semester_id);
    if (!classInfo) return null;

    const subjectRows = await reportModel.findRosterSubjectRows(classId, year_id, semester_id);
    const studentRows = await reportModel.findRosterStudentRows(classId, year_id, semester_id);
    const summaryRows = await reportModel.findRosterStudentSummaries(classId, year_id, semester_id);
    const { subjects, studentsWithCalculations } = reportService.buildRosterStudents(subjectRows, studentRows, summaryRows);

    return {
        class_info: classInfo,
        subjects,
        students: studentsWithCalculations,
        total_students: studentsWithCalculations.length,
        passed_students: studentsWithCalculations.filter((s) => s.status === 'PASS').length,
        failed_students: studentsWithCalculations.filter((s) => s.status === 'FAIL').length,
    };
}

const generateStudentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        const student = await reportModel.findStudentWithClass(id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const marks = await reportModel.findMarksForStudentTerm(id, year_id, semester_id);
        const totalScore = marks.reduce((sum, m) => sum + (m.mark || 0), 0);
        const average = marks.length > 0 ? totalScore / marks.length : 0;

        res.json({
            success: true,
            student,
            marks,
            summary: {
                total: totalScore,
                max_total: marks.length * 100,
                average: average.toFixed(2),
                status: average >= 50 ? 'PASS' : 'FAIL',
            },
        });
    } catch (error) {
        console.error('Error generating student report:', error);
        res.status(500).json({ success: false, message: 'Failed to generate student report', error: error.message });
    }
};

const generateClassReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        const classInfo = await reportModel.findClassHeader(id);
        if (!classInfo) return res.status(404).json({ success: false, message: 'Class not found' });

        const rawStudents = await reportModel.findClassStudentsMarksBlob(id, year_id, semester_id);
        let processedStudents = reportService.processClassReportStudents(rawStudents);
        processedStudents = reportService.rankClassReportStudents(processedStudents);

        res.json({
            success: true,
            class_info: classInfo,
            students: processedStudents,
            total_students: processedStudents.length,
            passed: processedStudents.filter((s) => s.status === 'PASS').length,
            failed: processedStudents.filter((s) => s.status === 'FAIL').length,
        });
    } catch (error) {
        console.error('Error generating class report:', error);
        res.status(500).json({ success: false, message: 'Failed to generate class report', error: error.message });
    }
};

const generateStudentRoster = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;
        const user = req.user;

        const homeroomRow = await reportModel.getHomeroomTeacherIdRow(classId);
        if (!homeroomRow) return res.status(404).json({ success: false, message: 'Class not found' });

        if (user.role !== 'admin') {
            if (!homeroomRow.homeroom_teacher_id || Number(homeroomRow.homeroom_teacher_id) !== Number(user.teacher_id)) {
                return res.status(403).json({ success: false, message: 'Only the homeroom teacher can generate the roster.' });
            }

            const approvalData = await markModel.getApprovalDataForHomeroom(user.teacher_id, year_id, semester_id);
            if (approvalData.error === 'no_subjects') {
                return res.status(400).json({ success: false, message: 'No subjects assigned to this class.' });
            }
            const incomplete = (approvalData.submissionStatus || []).filter(
                (s) => Number(s.submitted_count) < Number(approvalData.totalStudents)
            );
            if (incomplete.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing marks: ${incomplete.map((s) => `${s.subject_name} (${s.submitted_count}/${approvalData.totalStudents})`).join(', ')}`,
                });
            }
            const unapproved = await markModel.countUnapprovedMarksForClassTerm(Number(classId), year_id, semester_id);
            if (unapproved > 0) {
                return res.status(400).json({ success: false, message: 'Homeroom teacher must approve all marks first.' });
            }
        }

        const roster = await buildRosterResponse(classId, year_id, semester_id);
        if (!roster) return res.status(404).json({ success: false, message: 'Class not found' });

        // Marks are NOT deleted — they stay in the DB so "Load saved roster" can read them via views
        res.json({ success: true, ...roster, marks_cleared: 0 });
    } catch (error) {
        console.error('Error generating student roster:', error);
        res.status(500).json({ success: false, message: 'Failed to generate student roster', error: error.message });
    }
};

// Reads the same data live from views — works because marks are never deleted
const getStoredStudentRoster = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;
        const user = req.user;

        const homeroomRow = await reportModel.getHomeroomTeacherIdRow(classId);
        if (!homeroomRow) return res.status(404).json({ success: false, message: 'Class not found' });

        if (user.role !== 'admin') {
            if (!homeroomRow.homeroom_teacher_id || Number(homeroomRow.homeroom_teacher_id) !== Number(user.teacher_id)) {
                return res.status(403).json({ success: false, message: 'Only the homeroom teacher can access this roster.' });
            }
        }

        const roster = await buildRosterResponse(classId, year_id, semester_id);
        if (!roster) return res.status(404).json({ success: false, message: 'Class not found' });

        if (roster.students.length === 0) {
            return res.status(404).json({ success: false, message: 'No roster found. Generate the roster first.' });
        }

        res.json({ success: true, ...roster });
    } catch (error) {
        console.error('Error loading stored roster:', error);
        res.status(500).json({ success: false, message: 'Failed to load stored roster', error: error.message });
    }
};

const getClassStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;
        if (!id) return res.status(400).json({ success: false, message: 'Class ID is required' });

        const stats = await reportModel.getClassStatisticsRow(id, year_id, semester_id);
        res.json({
            success: true,
            statistics: {
                total_students: stats?.total_students || 0,
                class_average: stats?.class_average_total || 0,
                passed_count: stats?.passed_count || 0,
                failed_count: stats?.failed_count || 0,
            },
        });
    } catch (error) {
        console.error('Error getting class statistics:', error);
        res.status(500).json({ success: false, message: 'Failed to get class statistics', error: error.message });
    }
};

module.exports = {
    generateStudentReport,
    generateClassReport,
    generateStudentRoster,
    getStoredStudentRoster,
    getClassStatistics,
};

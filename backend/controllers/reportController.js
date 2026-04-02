const reportModel = require('../models/reportModel');
const markModel = require('../models/markModel');
const reportService = require('../services/reportService');
const rosterSnapshotModel = require('../models/rosterSnapshotModel');

async function assertRosterClassHomeroomOrAdmin(user, classId) {
    const homeroomRow = await reportModel.getHomeroomTeacherIdRow(classId);
    if (!homeroomRow) {
        return { error: { status: 404, message: 'Class not found' } };
    }
    if (user.role !== 'admin') {
        if (
            homeroomRow.homeroom_teacher_id == null ||
            Number(homeroomRow.homeroom_teacher_id) !== Number(user.teacher_id)
        ) {
            return {
                error: {
                    status: 403,
                    message: 'Only the homeroom teacher for this class can access this roster.',
                },
            };
        }
    }
    return { homeroomRow };
}

const generateStudentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        const student = await reportModel.findStudentWithClass(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }

        const marks = await reportModel.findMarksForStudentTerm(id, year_id, semester_id);
        const totalScore = marks.reduce((sum, m) => sum + (m.mark || 0), 0);
        const maxTotal = marks.length * 100;
        const average = marks.length > 0 ? totalScore / marks.length : 0;
        const status = average >= 50 ? 'PASS' : 'FAIL';

        res.json({
            success: true,
            student,
            marks,
            summary: {
                total: totalScore,
                max_total: maxTotal,
                average: average.toFixed(2),
                status,
            },
        });
    } catch (error) {
        console.error('Error generating student report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate student report',
            error: error.message,
        });
    }
};

const generateClassReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        const classInfo = await reportModel.findClassHeader(id);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }

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
        res.status(500).json({
            success: false,
            message: 'Failed to generate class report',
            error: error.message,
        });
    }
};

const generateStudentRoster = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;
        const user = req.user;

        const homeroomRow = await reportModel.getHomeroomTeacherIdRow(classId);
        if (!homeroomRow) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }

        if (user.role !== 'admin') {
            if (
                homeroomRow.homeroom_teacher_id == null ||
                Number(homeroomRow.homeroom_teacher_id) !== Number(user.teacher_id)
            ) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the homeroom teacher for this class can generate the roster.',
                });
            }

            // Keep the old workflow gate: roster can be generated only when
            // all assigned subjects have marks for every student in class-term.
            const approvalData = await markModel.getApprovalDataForHomeroom(
                user.teacher_id,
                year_id,
                semester_id
            );
            if (approvalData.error === 'no_subjects') {
                return res.status(400).json({
                    success: false,
                    message: 'No subjects are assigned to this class for the selected year.',
                });
            }
            const incompleteSubjects = (approvalData.submissionStatus || []).filter(
                (subject) => Number(subject.submitted_count) < Number(approvalData.totalStudents)
            );
            if (incompleteSubjects.length > 0) {
                const missingInfo = incompleteSubjects
                    .map(
                        (s) =>
                            `${s.subject_name} (${s.submitted_count}/${approvalData.totalStudents} students)`
                    )
                    .join(', ');
                return res.status(400).json({
                    success: false,
                    message: `Approve step incomplete. Missing marks: ${missingInfo}`,
                });
            }

            const unapprovedCount = await markModel.countUnapprovedMarksForClassTerm(
                Number(classId),
                year_id,
                semester_id
            );
            if (unapprovedCount > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        'This class is not approved yet for the selected term. Homeroom teacher must click Approve all marks first.',
                });
            }
        }

        const classInfo = await reportModel.findRosterClassInfo(classId, year_id, semester_id);
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found',
            });
        }

        const subjectRows = await reportModel.findRosterSubjectRows(classId, year_id, semester_id);
        await reportModel.ensureGroupConcatLen();
        const studentRows = await reportModel.findRosterStudentRows(classId, year_id, semester_id);
        const summaryRows = await reportModel.findRosterStudentSummaries(classId, year_id, semester_id);
        const { subjects, studentsWithCalculations } = reportService.buildRosterStudents(
            subjectRows,
            studentRows,
            summaryRows
        );

        const response = {
            success: true,
            class_info: classInfo,
            subjects,
            students: studentsWithCalculations,
            total_students: studentsWithCalculations.length,
            passed_students: studentsWithCalculations.filter((s) => s.status === 'PASS').length,
            failed_students: studentsWithCalculations.filter((s) => s.status === 'FAIL').length,
            marks_cleared: 0,
        };

        if (user.role !== 'admin' && user.teacher_id) {
            response.marks_cleared = await reportModel.deleteMarksForClassTerm(classId, year_id, semester_id);
        }

        const snapshotPayload = {
            class_info: response.class_info,
            subjects: response.subjects,
            students: response.students,
            total_students: response.total_students,
            passed_students: response.passed_students,
            failed_students: response.failed_students,
            marks_cleared: response.marks_cleared,
        };
        try {
            await rosterSnapshotModel.upsertSnapshot({
                classId: Number(classId),
                yearId: Number(year_id),
                semesterId: Number(semester_id),
                userId: user.user_id,
                payload: snapshotPayload,
            });
            response.snapshot_saved_at = new Date().toISOString();
        } catch (snapErr) {
            console.error('Roster snapshot save failed:', snapErr.message);
        }

        res.json(response);
    } catch (error) {
        console.error('Error generating student roster:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate student roster',
            error: error.message,
        });
    }
};

const getStoredStudentRoster = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;
        const user = req.user;

        const gate = await assertRosterClassHomeroomOrAdmin(user, classId);
        if (gate.error) {
            return res.status(gate.error.status).json({
                success: false,
                message: gate.error.message,
            });
        }

        const row = await rosterSnapshotModel.findByClassTerm(
            Number(classId),
            Number(year_id),
            Number(semester_id)
        );
        if (!row || !row.payload) {
            return res.status(404).json({
                success: false,
                message: 'No saved roster for this class, year, and semester.',
            });
        }

        res.json({
            success: true,
            ...row.payload,
            snapshot_meta: {
                roster_snapshot_id: row.roster_snapshot_id,
                generated_at: row.generated_at,
            },
        });
    } catch (error) {
        console.error('Error loading stored roster:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load stored roster',
            error: error.message,
        });
    }
};

const getClassStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Class ID is required',
            });
        }

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
        res.status(500).json({
            success: false,
            message: 'Failed to get class statistics',
            error: error.message,
        });
    }
};

module.exports = {
    generateStudentReport,
    generateClassReport,
    generateStudentRoster,
    getStoredStudentRoster,
    getClassStatistics,
};

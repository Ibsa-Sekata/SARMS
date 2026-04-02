const markModel = require('../models/markModel');
const studentModel = require('../models/studentModel');
const assignmentModel = require('../models/assignmentModel');

const getMarks = async (req, res) => {
    try {
        const marks = await markModel.findMarksForTeacherContext(req.user, req.query);
        res.json({ success: true, marks });
    } catch (error) {
        console.error('Error getting marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marks',
            error: error.message,
        });
    }
};

const getMarksByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { year_id = 2, semester_id = 1 } = req.query;
        const marks = await markModel.findByClass(classId, year_id, semester_id);
        res.json({ success: true, marks });
    } catch (error) {
        console.error('Error getting marks by class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marks',
            error: error.message,
        });
    }
};

const createMark = async (req, res) => {
    try {
        const { student_id, subject_id, teacher_id, semester_id, year_id, mark } = req.body;
        const user = req.user;

        if (!student_id || !subject_id || !teacher_id || !semester_id || !year_id || mark === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        if (mark < 0 || mark > 100) {
            return res.status(400).json({
                success: false,
                message: 'Mark must be between 0 and 100',
            });
        }

        if (user.role !== 'admin') {
            const student = await studentModel.getClassId(student_id);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found',
                });
            }
            const assign = await assignmentModel.findTeacherAssignment(
                user.teacher_id,
                subject_id,
                student.class_id,
                year_id
            );
            if (!assign) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to teach this subject to this class',
                });
            }
        }

        const result = await markModel.upsertMark(
            student_id,
            subject_id,
            teacher_id,
            semester_id,
            year_id,
            mark
        );
        res.status(201).json({
            success: true,
            message: 'Mark saved',
            mark_id: result.insertId || result.affectedRows,
        });
    } catch (error) {
        console.error('Error creating mark:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save mark',
            error: error.message,
        });
    }
};

const updateMark = async (req, res) => {
    try {
        const { id } = req.params;
        const { mark } = req.body;

        if (mark < 0 || mark > 100) {
            return res.status(400).json({
                success: false,
                message: 'Mark must be between 0 and 100',
            });
        }

        const affected = await markModel.updateMarkValue(id, mark);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mark not found',
            });
        }
        res.json({
            success: true,
            message: 'Mark updated successfully',
        });
    } catch (error) {
        console.error('Error updating mark:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update mark',
            error: error.message,
        });
    }
};

const deleteMark = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await markModel.deleteById(id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mark not found',
            });
        }
        res.json({
            success: true,
            message: 'Mark deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting mark:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete mark',
            error: error.message,
        });
    }
};

const submitMarks = async (req, res) => {
    try {
        const { marks } = req.body;
        const user = req.user;

        if (!marks || !Array.isArray(marks) || marks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Marks array is required',
            });
        }

        for (const mark of marks) {
            if (mark.mark < 0 || mark.mark > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'All marks must be between 0 and 100',
                });
            }
        }

        if (user.role !== 'admin') {
            for (const mark of marks) {
                const student = await studentModel.getClassId(mark.student_id);
                if (!student) {
                    return res.status(404).json({
                        success: false,
                        message: `Student ${mark.student_id} not found`,
                    });
                }
                const assign = await assignmentModel.findTeacherAssignment(
                    user.teacher_id,
                    mark.subject_id,
                    student.class_id,
                    mark.year_id
                );
                if (!assign) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not assigned to teach this subject to this class',
                    });
                }
            }
        }

        let successCount = 0;
        for (const mark of marks) {
            await markModel.upsertMark(
                mark.student_id,
                mark.subject_id,
                mark.teacher_id,
                mark.semester_id,
                mark.year_id,
                mark.mark
            );
            successCount++;
        }

        res.status(201).json({
            success: true,
            message: `${successCount} marks saved`,
        });
    } catch (error) {
        console.error('Error submitting marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit marks',
            error: error.message,
        });
    }
};

const submitToHomeroom = async (req, res) => {
    try {
        const { class_id, subject_id, year_id, semester_id } = req.body;
        const user = req.user;

        if (!class_id || !subject_id || !year_id || !semester_id) {
            return res.status(400).json({
                success: false,
                message: 'Class, subject, year, and semester are required',
            });
        }

        if (user.role !== 'admin') {
            const assign = await assignmentModel.findTeacherAssignment(
                user.teacher_id,
                subject_id,
                class_id,
                year_id
            );
            if (!assign) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not assigned to teach this subject to this class',
                });
            }
        }

        const cnt = await markModel.countMarksForSubmitToHomeroom(
            user.role === 'admin',
            user,
            class_id,
            subject_id,
            year_id,
            semester_id
        );

        if (cnt === 0) {
            return res.status(400).json({
                success: false,
                message: 'No marks found to notify. Save marks first.',
            });
        }

        res.json({
            success: true,
            message: `${cnt} marks recorded for homeroom review`,
            submitted_count: cnt,
        });
    } catch (error) {
        console.error('Error submitting to homeroom:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit marks to homeroom teacher',
            error: error.message,
        });
    }
};

const getSubmittedMarksForHomeroom = async (req, res) => {
    try {
        const user = req.user;
        const { year_id, semester_id } = req.query;

        const meta = await markModel.findHomeroomClassMeta(user.teacher_id);
        if (!meta) {
            return res.status(403).json({
                success: false,
                message: 'You are not a homeroom teacher',
            });
        }

        const classId = meta.class_id;
        const marks = await markModel.findSubmittedMarksForClass(classId, year_id, semester_id);
        const summary = await markModel.homeroomSummaryForClass(classId, year_id, semester_id);

        res.json({
            success: true,
            class_id: classId,
            marks,
            summary,
        });
    } catch (error) {
        console.error('Error getting submitted marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get submitted marks',
            error: error.message,
        });
    }
};

const approveAllMarks = async (req, res) => {
    try {
        const user = req.user;
        const { year_id, semester_id } = req.body;

        const data = await markModel.getApprovalDataForHomeroom(user.teacher_id, year_id, semester_id);
        if (data.error === 'not_homeroom') {
            return res.status(403).json({
                success: false,
                message: 'You are not a homeroom teacher',
            });
        }
        if (data.error === 'no_subjects') {
            return res.status(400).json({
                success: false,
                message: 'No subjects assigned to this class',
            });
        }

        const { totalStudents, submissionStatus } = data;
        const incompleteSubjects = submissionStatus.filter((subject) => Number(subject.submitted_count) < totalStudents);

        if (incompleteSubjects.length > 0) {
            const missingInfo = incompleteSubjects
                .map((s) => `${s.subject_name} (${s.submitted_count}/${totalStudents} students)`)
                .join(', ');
            return res.status(400).json({
                success: false,
                message: `Not all subjects have marks for every student. Missing: ${missingInfo}`,
            });
        }

        // No DB approval table is used. This endpoint only validates completeness.
        const approvedRows = await markModel.approveMarksForClassTerm(
            data.classId,
            year_id,
            semester_id,
            user.teacher_id
        );
        res.json({
            success: true,
            message: 'Marks approved for this class only.',
            approved_count: approvedRows,
        });
    } catch (error) {
        console.error('Error approving marks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve marks',
            error: error.message,
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
    approveAllMarks,
};

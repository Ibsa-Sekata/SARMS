const departmentModel = require('../models/departmentModel');

const getDepartments = async (req, res) => {
    try {
        const departments = await departmentModel.findAllOrdered();
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Error getting departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get departments',
            error: error.message,
        });
    }
};

const createDepartment = async (req, res) => {
    const { department_name, subjects: subjectInput } = req.body;

    if (!department_name || !String(department_name).trim()) {
        return res.status(400).json({
            success: false,
            message: 'Department name is required',
        });
    }

    const wantsSubjects = Object.prototype.hasOwnProperty.call(req.body, 'subjects');
    let subjectNames = [];
    if (wantsSubjects) {
        if (!Array.isArray(subjectInput)) {
            return res.status(400).json({
                success: false,
                message: 'subjects must be an array of { subject_name } or strings',
            });
        }
        subjectNames = subjectInput
            .map((item) => {
                if (item == null) return '';
                if (typeof item === 'string') return item.trim();
                if (typeof item.subject_name === 'string') return item.subject_name.trim();
                return '';
            })
            .filter(Boolean);
        if (subjectNames.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Add at least one subject for this department.',
            });
        }
    }

    try {
        if (wantsSubjects) {
            const { department_id, createdSubjects } = await departmentModel.insertWithSubjects(
                String(department_name).trim(),
                subjectNames
            );
            return res.status(201).json({
                success: true,
                message: 'Department and subjects created successfully',
                department_id,
                subjects: createdSubjects,
            });
        }
        const department_id = await departmentModel.insertDepartmentOnly(String(department_name).trim());
        return res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department_id,
            subjects: [],
        });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create department',
            error: error.message,
        });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name, add_subjects, remove_subject_ids } = req.body;
        if (!department_name || !String(department_name).trim()) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required',
            });
        }

        const addSubjectNames = Array.isArray(add_subjects)
            ? add_subjects.map((s) => String(s || '').trim()).filter(Boolean)
            : [];
        const removeSubjectIds = Array.isArray(remove_subject_ids)
            ? remove_subject_ids
                  .map((sid) => Number(sid))
                  .filter((sid) => Number.isInteger(sid) && sid > 0)
            : [];

        const updateResult = await departmentModel.updateDepartmentWithSubjects(
            Number(id),
            String(department_name).trim(),
            addSubjectNames,
            removeSubjectIds
        );
        if (updateResult.affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        return res.json({
            success: true,
            message: 'Department updated successfully',
            added_subjects: updateResult.addedSubjects,
            removed_subjects: updateResult.removedSubjects,
        });
    } catch (error) {
        console.error('Error updating department:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update department',
            error: error.message,
        });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const teacherCount = await departmentModel.countTeachers(id);
        if (teacherCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department. It has ${teacherCount} teacher(s). Please reassign or remove teachers first.`,
            });
        }

        const subjectCount = await departmentModel.countSubjects(id);
        if (subjectCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department. It has ${subjectCount} subject(s). Please reassign or remove subjects first.`,
            });
        }

        const affected = await departmentModel.deleteById(id);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        res.json({
            success: true,
            message: 'Department deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete department',
            error: error.message,
        });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};

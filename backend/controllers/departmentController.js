const db = require('../config/db');

// Get all departments
const getDepartments = async (req, res) => {
    try {
        const [departments] = await db.execute(`
            SELECT department_id, department_name
            FROM departments
            ORDER BY department_name
        `);

        res.json({
            success: true,
            departments: departments
        });

    } catch (error) {
        console.error('Error getting departments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get departments',
            error: error.message
        });
    }
};

// Create new department
const createDepartment = async (req, res) => {
    try {
        const { department_name } = req.body;

        if (!department_name) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }

        const [result] = await db.execute(`
            INSERT INTO departments (department_name)
            VALUES (?)
        `, [department_name]);

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            department_id: result.insertId
        });

    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create department',
            error: error.message
        });
    }
};

// Delete department
const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department has teachers
        const [teachers] = await db.execute(
            'SELECT COUNT(*) as count FROM teachers WHERE department_id = ?',
            [id]
        );

        if (teachers[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department. It has ${teachers[0].count} teacher(s). Please reassign or remove teachers first.`
            });
        }

        // Check if department has subjects
        const [subjects] = await db.execute(
            'SELECT COUNT(*) as count FROM subjects WHERE department_id = ?',
            [id]
        );

        if (subjects[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department. It has ${subjects[0].count} subject(s). Please reassign or remove subjects first.`
            });
        }

        const [result] = await db.execute('DELETE FROM departments WHERE department_id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        res.json({
            success: true,
            message: 'Department deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete department',
            error: error.message
        });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    deleteDepartment
};

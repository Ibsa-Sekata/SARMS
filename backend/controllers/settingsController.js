const db = require('../config/db');

// Get all system settings
const getSettings = async (req, res) => {
    try {
        const [settings] = await db.execute(`
            SELECT setting_key, setting_value, description
            FROM system_settings
        `);

        // Convert to object format
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.setting_key] = setting.setting_value;
        });

        res.json({
            success: true,
            settings: settingsObj
        });

    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message
        });
    }
};

// Get current academic context (year and semester)
const getCurrentContext = async (req, res) => {
    try {
        // Check if settings table exists and has data
        const [settings] = await db.execute(`
            SELECT setting_key, setting_value
            FROM system_settings
            WHERE setting_key IN ('current_year_id', 'current_semester_id')
        `);

        if (settings.length === 0) {
            // No settings found, return defaults
            return res.json({
                success: true,
                context: {
                    year_id: null,
                    year_name: 'Not Set',
                    semester_id: 1,
                    semester_name: '1st Semester'
                }
            });
        }

        const yearId = settings.find(s => s.setting_key === 'current_year_id')?.setting_value;
        const semesterId = settings.find(s => s.setting_key === 'current_semester_id')?.setting_value;

        // Get year details
        const [years] = await db.execute(`
            SELECT year_id, year_name
            FROM academic_years
            WHERE year_id = ?
        `, [yearId]);

        // Map semester ID to name
        const semesterName = semesterId === '1' ? '1st Semester' : '2nd Semester';

        res.json({
            success: true,
            context: {
                year_id: yearId ? parseInt(yearId) : null,
                year_name: years[0]?.year_name || 'Not Set',
                semester_id: parseInt(semesterId),
                semester_name: semesterName
            }
        });

    } catch (error) {
        console.error('Error getting current context:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current context',
            error: error.message
        });
    }
};

// Update system setting
const updateSetting = async (req, res) => {
    try {
        const { setting_key, setting_value } = req.body;

        if (!setting_key || !setting_value) {
            return res.status(400).json({
                success: false,
                message: 'Setting key and value are required'
            });
        }

        // Validate setting_key
        const validKeys = ['current_year_id', 'current_semester_id'];
        if (!validKeys.includes(setting_key)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid setting key'
            });
        }

        // Update setting
        const [result] = await db.execute(`
            UPDATE system_settings
            SET setting_value = ?
            WHERE setting_key = ?
        `, [setting_value, setting_key]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        res.json({
            success: true,
            message: 'Setting updated successfully'
        });

    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update setting',
            error: error.message
        });
    }
};

// Update current academic context (year and semester together)
const updateCurrentContext = async (req, res) => {
    try {
        const { year_name, semester_id } = req.body;

        console.log('Updating context with:', { year_name, semester_id });

        if (!year_name || !semester_id) {
            return res.status(400).json({
                success: false,
                message: 'Year name and Semester ID are required'
            });
        }

        // Validate semester (only 1 or 2)
        if (semester_id !== 1 && semester_id !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Semester must be 1 or 2'
            });
        }

        // Check if year exists, if not create it
        let [years] = await db.execute(
            'SELECT year_id FROM academic_years WHERE year_name = ?',
            [year_name]
        );

        let yearId;
        if (years.length === 0) {
            // Create new academic year
            const [result] = await db.execute(
                'INSERT INTO academic_years (year_name) VALUES (?)',
                [year_name]
            );
            yearId = result.insertId;
            console.log('Created new academic year:', year_name, 'with ID:', yearId);
        } else {
            yearId = years[0].year_id;
            console.log('Using existing academic year:', year_name, 'with ID:', yearId);
        }

        // Update both settings
        await db.execute(`
            INSERT INTO system_settings (setting_key, setting_value, description)
            VALUES ('current_year_id', ?, 'Current academic year ID')
            ON DUPLICATE KEY UPDATE setting_value = ?
        `, [yearId, yearId]);

        await db.execute(`
            INSERT INTO system_settings (setting_key, setting_value, description)
            VALUES ('current_semester_id', ?, 'Current semester ID')
            ON DUPLICATE KEY UPDATE setting_value = ?
        `, [semester_id, semester_id]);

        console.log('Context updated successfully');

        res.json({
            success: true,
            message: 'Academic context updated successfully',
            year_id: yearId
        });

    } catch (error) {
        console.error('Error updating context:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update context',
            error: error.message,
            details: error.sqlMessage || error.toString()
        });
    }
};

// Get all academic years
const getAcademicYears = async (req, res) => {
    try {
        const [years] = await db.execute(`
            SELECT year_id, year_name
            FROM academic_years
            ORDER BY year_name DESC
        `);

        res.json({
            success: true,
            years: years
        });

    } catch (error) {
        console.error('Error getting academic years:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get academic years',
            error: error.message
        });
    }
};

// Get all semesters (fixed to 1st and 2nd)
const getSemesters = async (req, res) => {
    try {
        // Return fixed semesters
        const semesters = [
            { semester_id: 1, semester_name: '1st Semester' },
            { semester_id: 2, semester_name: '2nd Semester' }
        ];

        res.json({
            success: true,
            semesters: semesters
        });

    } catch (error) {
        console.error('Error getting semesters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get semesters',
            error: error.message
        });
    }
};

module.exports = {
    getSettings,
    getCurrentContext,
    updateSetting,
    updateCurrentContext,
    getAcademicYears,
    getSemesters
};

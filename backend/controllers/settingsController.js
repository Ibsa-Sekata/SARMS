const settingsModel = require('../models/settingsModel');

const getSettings = async (req, res) => {
    try {
        const settings = await settingsModel.findAllKeyValue();
        const settingsObj = {};
        settings.forEach((setting) => {
            settingsObj[setting.setting_key] = setting.setting_value;
        });
        res.json({ success: true, settings: settingsObj });
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message,
        });
    }
};

const getCurrentContext = async (req, res) => {
    try {
        const settings = await settingsModel.findContextKeys();
        if (settings.length === 0) {
            return res.json({
                success: true,
                context: {
                    year_id: null,
                    year_name: 'Not Set',
                    semester_id: 1,
                    semester_name: '1st Semester',
                },
            });
        }

        const yearId = settings.find((s) => s.setting_key === 'current_year_id')?.setting_value;
        const semesterId = settings.find((s) => s.setting_key === 'current_semester_id')?.setting_value;
        const yearRow = yearId ? await settingsModel.findYearById(yearId) : null;
        const semesterName = semesterId === '1' ? '1st Semester' : '2nd Semester';

        res.json({
            success: true,
            context: {
                year_id: yearId ? parseInt(yearId) : null,
                year_name: yearRow?.year_name || 'Not Set',
                semester_id: parseInt(semesterId),
                semester_name: semesterName,
            },
        });
    } catch (error) {
        console.error('Error getting current context:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current context',
            error: error.message,
        });
    }
};

const updateSetting = async (req, res) => {
    try {
        const { setting_key, setting_value } = req.body;

        if (!setting_key || !setting_value) {
            return res.status(400).json({
                success: false,
                message: 'Setting key and value are required',
            });
        }

        const validKeys = ['current_year_id', 'current_semester_id'];
        if (!validKeys.includes(setting_key)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid setting key',
            });
        }

        const affected = await settingsModel.updateSettingValue(setting_key, setting_value);
        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found',
            });
        }

        res.json({
            success: true,
            message: 'Setting updated successfully',
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update setting',
            error: error.message,
        });
    }
};

const updateCurrentContext = async (req, res) => {
    try {
        const { year_name, semester_id } = req.body;

        if (!year_name || !semester_id) {
            return res.status(400).json({
                success: false,
                message: 'Year name and Semester ID are required',
            });
        }

        if (semester_id !== 1 && semester_id !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Semester must be 1 or 2',
            });
        }

        let existing = await settingsModel.findYearByName(year_name);
        let yearId;
        if (!existing) {
            yearId = await settingsModel.insertYear(year_name);
        } else {
            yearId = existing.year_id;
        }

        await settingsModel.upsertSetting('current_year_id', yearId, 'Current academic year ID');
        await settingsModel.upsertSetting('current_semester_id', semester_id, 'Current semester ID');

        res.json({
            success: true,
            message: 'Academic context updated successfully',
            year_id: yearId,
        });
    } catch (error) {
        console.error('Error updating context:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update context',
            error: error.message,
            details: error.sqlMessage || error.toString(),
        });
    }
};

const getAcademicYears = async (req, res) => {
    try {
        const years = await settingsModel.findAcademicYearsOrdered();
        res.json({ success: true, years });
    } catch (error) {
        console.error('Error getting academic years:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get academic years',
            error: error.message,
        });
    }
};

const getSemesters = async (req, res) => {
    try {
        const semesters = [
            { semester_id: 1, semester_name: '1st Semester' },
            { semester_id: 2, semester_name: '2nd Semester' },
        ];
        res.json({ success: true, semesters });
    } catch (error) {
        console.error('Error getting semesters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get semesters',
            error: error.message,
        });
    }
};

module.exports = {
    getSettings,
    getCurrentContext,
    updateSetting,
    updateCurrentContext,
    getAcademicYears,
    getSemesters,
};

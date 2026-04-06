const sectionModel = require('../models/sectionModel');

const getSections = async (req, res) => {
    try {
        const sections = await sectionModel.findAllOrdered();
        res.json({ success: true, sections });
    } catch (error) {
        console.error('Error getting sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sections',
            error: error.message,
        });
    }
};

const createSection = async (req, res) => {
    try {
        const { section_name } = req.body;
        if (section_name === undefined || section_name === null || String(section_name).trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'section_name is required (one letter or digit, e.g. A or B)',
            });
        }

        const normalized = sectionModel.normalizeSectionName(section_name);
        if (!normalized) {
            return res.status(400).json({
                success: false,
                message: 'Section must be a single letter (A–Z) or digit (0–9)',
            });
        }

        const existing = await sectionModel.findByName(normalized);
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Section already exists',
                section_id: existing.section_id,
                section_name: existing.section_name,
                existing: true,
            });
        }

        const { section_id, section_name: name } = await sectionModel.insert(section_name);
        return res.status(201).json({
            success: true,
            message: 'Section created',
            section_id,
            section_name: name,
            existing: false,
        });
    } catch (error) {
        console.error('Error creating section:', error);
        if (error.code === 'VALIDATION') {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        if (error.code === 'ER_DUP_ENTRY') {
            const normalized = sectionModel.normalizeSectionName(req.body.section_name);
            if (normalized) {
                const row = await sectionModel.findByName(normalized);
                if (row) {
                    return res.status(200).json({
                        success: true,
                        message: 'Section already exists',
                        section_id: row.section_id,
                        section_name: row.section_name,
                        existing: true,
                    });
                }
            }
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to create section',
            error: error.message,
        });
    }
};

module.exports = { getSections, createSection };

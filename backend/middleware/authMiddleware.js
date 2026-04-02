const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Get user from database using the new schema
            const [users] = await db.execute(`
                SELECT 
                    u.user_id,
                    u.username,
                    u.email,
                    u.role,
                    t.teacher_id,
                    t.teacher_name,
                    t.department_id
                FROM users u
                LEFT JOIN teachers t ON u.user_id = t.user_id
                WHERE u.user_id = ?
            `, [decoded.user_id]);

            if (users.length === 0) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            req.user = users[0];
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Check if user is homeroom teacher
const isHomeroomTeacher = async (req, res, next) => {
    try {
        // Check if user is admin (admins have full access)
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if teacher is a homeroom teacher
        const [rows] = await db.execute(
            'SELECT class_id FROM classes WHERE homeroom_teacher_id = ?',
            [req.user.teacher_id]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - Homeroom teacher privileges required'
            });
        }

        req.user.homeroom_class_id = rows[0].class_id;
        next();
    } catch (error) {
        console.error('Homeroom check error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check if user is subject teacher for specific class
const isSubjectTeacher = async (req, res, next) => {
    try {
        // Check if user is admin (admins have full access)
        if (req.user.role === 'admin') {
            return next();
        }

        const classId = req.params.classId || req.body.class_id;

        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'Class ID required'
            });
        }

        // Check teacher assignments using new schema
        const [rows] = await db.execute(
            'SELECT subject_id FROM teacher_assignments WHERE class_id = ? AND teacher_id = ?',
            [classId, req.user.teacher_id]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - Not assigned to teach this class'
            });
        }

        req.user.teaching_subjects = rows.map(row => row.subject_id);
        next();
    } catch (error) {
        console.error('Subject teacher check error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const adminOnly = (req, res, next) => {
    const role = String(req.user?.role ?? '')
        .trim()
        .toLowerCase();
    if (role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Administrator access required'
        });
    }
    next();
};

module.exports = {
    protect,
    isHomeroomTeacher,
    isSubjectTeacher,
    adminOnly
};

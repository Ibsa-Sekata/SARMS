const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Login for users (admin or teacher)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user by username and password
        const [users] = await db.execute(`
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role,
                t.teacher_id,
                t.teacher_name,
                t.department_id,
                d.department_name
            FROM users u
            LEFT JOIN teachers t ON u.user_id = t.user_id
            LEFT JOIN departments d ON t.department_id = d.department_id
            WHERE u.username = ? AND u.password = ?
        `, [username, password]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // If user is a teacher, get homeroom class info
        let homeroomClass = null;
        if (user.role === 'teacher' && user.teacher_id) {
            const [classes] = await db.execute(`
                SELECT 
                    c.class_id,
                    g.grade_number,
                    s.section_name
                FROM classes c
                JOIN grades g ON c.grade_id = g.grade_id
                JOIN sections s ON c.section_id = s.section_id
                WHERE c.homeroom_teacher_id = ?
            `, [user.teacher_id]);

            if (classes.length > 0) {
                homeroomClass = classes[0];
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
                teacher_id: user.teacher_id
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Prepare response based on role
        const responseData = {
            success: true,
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };

        // Add teacher-specific data if user is a teacher
        if (user.role === 'teacher') {
            responseData.user.teacher_id = user.teacher_id;
            responseData.user.teacher_name = user.teacher_name;
            responseData.user.department_id = user.department_id;
            responseData.user.department_name = user.department_name;

            if (homeroomClass) {
                responseData.user.homeroom_class_id = homeroomClass.class_id;
                responseData.user.grade = homeroomClass.grade_number;
                responseData.user.section = homeroomClass.section_name;
                responseData.user.is_homeroom_teacher = true;
            } else {
                responseData.user.is_homeroom_teacher = false;
            }
        }

        res.json(responseData);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// Get current user info
const getMe = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [users] = await db.execute(`
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.role,
                t.teacher_id,
                t.teacher_name,
                t.department_id,
                d.department_name
            FROM users u
            LEFT JOIN teachers t ON u.user_id = t.user_id
            LEFT JOIN departments d ON t.department_id = d.department_id
            WHERE u.user_id = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // If user is a teacher, get homeroom class info
        let homeroomClass = null;
        if (user.role === 'teacher' && user.teacher_id) {
            const [classes] = await db.execute(`
                SELECT 
                    c.class_id,
                    g.grade_number,
                    s.section_name
                FROM classes c
                JOIN grades g ON c.grade_id = g.grade_id
                JOIN sections s ON c.section_id = s.section_id
                WHERE c.homeroom_teacher_id = ?
            `, [user.teacher_id]);

            if (classes.length > 0) {
                homeroomClass = classes[0];
            }
        }

        const responseData = {
            success: true,
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };

        if (user.role === 'teacher') {
            responseData.user.teacher_id = user.teacher_id;
            responseData.user.teacher_name = user.teacher_name;
            responseData.user.department_id = user.department_id;
            responseData.user.department_name = user.department_name;

            if (homeroomClass) {
                responseData.user.homeroom_class_id = homeroomClass.class_id;
                responseData.user.grade = homeroomClass.grade_number;
                responseData.user.section = homeroomClass.section_name;
                responseData.user.is_homeroom_teacher = true;
            } else {
                responseData.user.is_homeroom_teacher = false;
            }
        }

        res.json(responseData);

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Logout (simple token invalidation)
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    login,
    getMe,
    logout
};

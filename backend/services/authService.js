const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

function buildAuthResponse(user, homeroomClass) {
    const token = jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            teacher_id: user.teacher_id,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    const responseData = {
        success: true,
        message: 'Login successful',
        token,
        user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
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

    return responseData;
}

function buildMeResponse(user, homeroomClass) {
    const responseData = {
        success: true,
        user: {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
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

    return responseData;
}

async function login(username, password) {
    const user = await userModel.findByUsernameWithAuthData(username);
    if (!user) return null;
    const storedPassword = String(user.password || '');
    const isBcryptHash =
        storedPassword.startsWith('$2a$') ||
        storedPassword.startsWith('$2b$') ||
        storedPassword.startsWith('$2y$');
    const passwordOk = isBcryptHash
        ? await bcrypt.compare(password, storedPassword)
        : storedPassword === String(password);
    if (!passwordOk) return null;

    let homeroomClass = null;
    if (user.role === 'teacher' && user.teacher_id) {
        homeroomClass = await userModel.findHomeroomClassForTeacher(user.teacher_id);
    }
    return buildAuthResponse(user, homeroomClass);
}

async function getMe(userId) {
    const user = await userModel.findById(userId);
    if (!user) return null;
    let homeroomClass = null;
    if (user.role === 'teacher' && user.teacher_id) {
        homeroomClass = await userModel.findHomeroomClassForTeacher(user.teacher_id);
    }
    return buildMeResponse(user, homeroomClass);
}

module.exports = {
    login,
    getMe,
};

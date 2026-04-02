const authService = require('../services/authService');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        const payload = await authService.login(username, password);
        if (!payload) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        res.json(payload);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message,
        });
    }
};

const getMe = async (req, res) => {
    try {
        const payload = await authService.getMe(req.user.user_id);
        if (!payload) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.json(payload);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
};

module.exports = {
    login,
    getMe,
    logout,
};

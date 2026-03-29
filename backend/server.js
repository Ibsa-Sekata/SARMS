const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { ensureSettingsTable } = require('./utils/initDatabase');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database tables on startup
ensureSettingsTable().catch(err => {
    console.error('Failed to initialize database:', err);
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/marks', require('./routes/markRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/teacher-assignments', require('./routes/assignmentRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Error handling middleware
app.use(require('./middleware/errorMiddleware'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'SRMS Backend API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log(`🚀 SRMS Backend server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
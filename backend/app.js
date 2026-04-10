const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'https://sarms.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/stats', require('./routes/statsRoutes'));

app.use(require('./middleware/errorMiddleware'));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'SRMS Backend API is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
});

module.exports = app;

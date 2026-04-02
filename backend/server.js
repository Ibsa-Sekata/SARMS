const dotenv = require('dotenv');
const {
    ensureSettingsTable,
    ensureMarksApprovalColumns,
    ensureRosterSnapshotsTable,
} = require('./utils/initDatabase');

dotenv.config();

const app = require('./app');
const PORT = process.env.PORT || 5000;

Promise.all([ensureSettingsTable(), ensureMarksApprovalColumns(), ensureRosterSnapshotsTable()]).catch((err) => {
    console.error('Failed to initialize database:', err);
});

app.listen(PORT, () => {
    console.log(`🚀 SRMS Backend server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const PORT = process.env.PORT || 5000;

const {
    ensureSettingsTable,
    ensureMarksApprovalColumns,
    ensureRosterSnapshotsTable,
} = require('./utils/initDatabase');

// Safe DB initialization
const initDB = async () => {
    try {
        await Promise.all([
            ensureSettingsTable(),
            ensureMarksApprovalColumns(),
            ensureRosterSnapshotsTable(),
        ]);

        console.log("✅ Database initialization completed");
    } catch (err) {
        console.error("❌ Failed to initialize database:", err.message);
    }
};

initDB();

app.listen(PORT, () => {
    console.log(`🚀 SRMS Backend server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
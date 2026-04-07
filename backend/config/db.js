const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();
const db=`mysql://root:qnqWBmkMjuLzOEyEXpYjSXIiwEzGbcHH@maglev.proxy.rlwy.net:33033/railway`
// Create connection pool
const pool = mysql.createPool(
    process.env.db);

// Get promise-based connection
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully to school_system');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Initialize database connection
testConnection();

// Export promisePool as default for easier usage
module.exports = promisePool;
module.exports.pool = pool;
module.exports.testConnection = testConnection;

const pool = require("./db");

async function testConnection() {
    try {
        const [rows] = await pool.query(
            "SELECT VERSION() AS version, DATABASE() AS database_name"
        );

        console.log("MySQL connection successful!");
        console.log("Database:", rows[0].database_name);
        console.log("MySQL version:", rows[0].version);
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

testConnection();

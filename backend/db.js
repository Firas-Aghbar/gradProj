const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost', // Database host (e.g., 'localhost' or IP address)
    user: 'root', // Database user
    password: '', // Database password
    database: 'food2go', // Database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
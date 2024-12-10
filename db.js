const mysql = require('mysql2');

// Create a connection to the database
const db = mysql.createConnection({
  host: 'database-1.cluster-c90gc4uuyu3f.eu-west-2.rds.amazonaws.com', // Database endpoint
  user: 'admin1',                                                     // Database username
  password: 'Renzmunii.13',                                           // Database password
  database: 'database-1'                                              // Database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database');
});

module.exports = db;

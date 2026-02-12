const { Pool } = require('pg');
require('dotenv').config();

// Ensure database connection is present before starting
if (!process.env.DATABASE_URL) {
  console.error("DB URL is missing in .env");
  process.exit(1);
}


// Pool is preferred over a single client for scalability in web servers
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Global error handler for idle clients prevents the app from crashing silently
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
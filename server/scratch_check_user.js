const { pool } = require('./config/dbConfig');

async function checkUser() {
  try {
    const res = await pool.query('SELECT username, "passwordHash" FROM users WHERE username ILIKE \'%wahaj%\'');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkUser();

const { pool } = require('./config/dbConfig');
const bcrypt = require('bcrypt');

async function resetPass() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    const res = await pool.query('UPDATE users SET "passwordHash" = $1 WHERE username = \'Wahajjj\'', [hash]);
    console.log('Successfully updated password for Wahajjj');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

resetPass();

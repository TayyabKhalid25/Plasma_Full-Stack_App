require('dotenv').config({ path: './server/.env' });
const { pool } = require('./config/dbConfig');

async function checkSchema() {
    try {
        const achRes = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'achievements'`);
        console.log('Achievements Table:');
        console.table(achRes.rows);

        const uaRes = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_achievements'`);
        console.log('\nUser Achievements Table:');
        console.table(uaRes.rows);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();

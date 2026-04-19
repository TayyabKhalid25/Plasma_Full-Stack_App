/**
 * Database Schema Verification Tool
 * 
 * This script compares your local 'plasma_schema.sql' file 
 * with the actual tables currently living in your Neon database.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/dbConfig');

const SQL_FILE_PATH = path.join(__dirname, '../../plasma_schema.sql');

async function verifySchema() {
    console.log('--- Starting Schema Verification ---\n');

    try {
        // 1. Read the local SQL file
        if (!fs.existsSync(SQL_FILE_PATH)) {
            throw new Error(`File not found: ${SQL_FILE_PATH}`);
        }
        const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf8');

        // 2. Extract table names using Regex
        // Pattern matches: CREATE TABLE "tableName"
        const tableRegex = /CREATE TABLE "(\w+)"/g;
        const expectedTables = [];
        let match;
        while ((match = tableRegex.exec(sqlContent)) !== null) {
            expectedTables.push(match[1]);
        }

        if (expectedTables.length === 0) {
            console.log('⚠️ No tables found in plasma_schema.sql. Check the regex or file content.');
            return;
        }

        console.log(`Checking for ${expectedTables.length} expected tables...`);

        // 3. Query the actual database for existing tables
        const dbResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const actualTables = dbResult.rows.map(row => row.table_name);

        // 4. Compare
        const missingTables = expectedTables.filter(t => !actualTables.includes(t));
        const extraTables = actualTables.filter(t => !expectedTables.includes(t));

        console.log('\n--- RESULTS ---');
        
        if (missingTables.length === 0) {
            console.log('✅ All expected tables exist in the database.');
        } else {
            console.log('❌ MISSING TABLES:');
            missingTables.forEach(t => console.log(`   - ${t}`));
            console.log('\nTip: Copy the content of plasma_schema.sql and run it in the Neon SQL Editor.');
        }

        if (extraTables.length > 0) {
            console.log('\nℹ️ EXTRA TABLES (Not in plasma_schema.sql):');
            extraTables.forEach(t => console.log(`   - ${t}`));
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
    } finally {
        await pool.end();
        console.log('\n--- Verification Finished ---');
    }
}

verifySchema();

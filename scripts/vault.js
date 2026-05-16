/**
 * Zero-Cloud Vault Utility — Unified for Client + Server
 * 
 * Encrypts and decrypts BOTH environment files in a single operation:
 *   - server/.env
 *   - client/.env.local
 *
 * USAGE:
 *   Encrypt: node scripts/vault.js encrypt
 *   Decrypt: node scripts/vault.js decrypt
 *
 * Both files share the same team password. You will be prompted once.
 * DO NOT commit .env or .env.local files.
 * DO commit the .enc files.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Root of the project (one level up from scripts/)
const ROOT = path.join(__dirname, '..');

/**
 * Defines the pairs of plaintext → encrypted files to process.
 * Each entry is { name, envFile, vaultFile }.
 */
const TARGETS = [
    {
        name: 'Server',
        envFile: path.join(ROOT, 'server', '.env'),
        vaultFile: path.join(ROOT, 'server', 'secrets.enc'),
    },
    {
        name: 'Client',
        envFile: path.join(ROOT, 'client', '.env.local'),
        vaultFile: path.join(ROOT, 'client', 'secrets.enc'),
    },
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askPassword(query) {
    return new Promise((resolve) => {
        rl.question(query, (ans) => resolve(ans));
    });
}

async function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 32, (err, key) => {
            if (err) reject(err);
            resolve(key);
        });
    });
}

/**
 * Encrypts a single file.
 * @param {string} envFile   - Path to plaintext .env file
 * @param {string} vaultFile - Path to output .enc file
 * @param {string} password  - Team password
 */
async function encryptFile(envFile, vaultFile, password) {
    if (!fs.existsSync(envFile)) {
        console.warn(`  ⚠ Skipped: ${envFile} not found`);
        return false;
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const content = fs.readFileSync(envFile);

    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // File structure: [salt(16)] [iv(12)] [authTag(16)] [encryptedContent]
    const vaultData = Buffer.concat([salt, iv, authTag, encrypted]);
    fs.writeFileSync(vaultFile, vaultData);

    console.log(`  ✔ Encrypted: ${envFile} → ${vaultFile}`);
    return true;
}

/**
 * Decrypts a single file.
 * @param {string} vaultFile - Path to .enc file
 * @param {string} envFile   - Path to output .env file
 * @param {string} password  - Team password
 */
async function decryptFile(vaultFile, envFile, password) {
    if (!fs.existsSync(vaultFile)) {
        console.warn(`  ⚠ Skipped: ${vaultFile} not found`);
        return false;
    }

    const vaultData = fs.readFileSync(vaultFile);

    const salt = vaultData.slice(0, SALT_LENGTH);
    const iv = vaultData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = vaultData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedContent = vaultData.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = await deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
    fs.writeFileSync(envFile, decrypted);

    console.log(`  ✔ Decrypted: ${vaultFile} → ${envFile}`);
    return true;
}

async function encrypt() {
    const password = await askPassword('Enter Team Password to ENCRYPT all .env files: ');
    if (!password) {
        console.error('Password cannot be empty.');
        process.exit(1);
    }

    console.log('\nEncrypting environment files...');
    let count = 0;
    for (const target of TARGETS) {
        console.log(`\n[${target.name}]`);
        const ok = await encryptFile(target.envFile, target.vaultFile, password);
        if (ok) count++;
    }

    console.log(`\n✅ Done. ${count}/${TARGETS.length} files encrypted. Safe to commit .enc files.`);
    rl.close();
}

async function decrypt() {
    const password = await askPassword('Enter Team Password to DECRYPT all secrets.enc files: ');

    console.log('\nDecrypting environment files...');
    let count = 0;
    for (const target of TARGETS) {
        console.log(`\n[${target.name}]`);
        try {
            const ok = await decryptFile(target.vaultFile, target.envFile, password);
            if (ok) count++;
        } catch (err) {
            console.error(`  ✘ Decryption failed for ${target.name}. Incorrect password?`);
        }
    }

    console.log(`\n✅ Done. ${count}/${TARGETS.length} files decrypted. Local environment ready.`);
    rl.close();
}

const mode = process.argv[2];
if (mode === 'encrypt') {
    encrypt();
} else if (mode === 'decrypt') {
    decrypt();
} else {
    console.log('Usage: node scripts/vault.js [encrypt|decrypt]');
    console.log('  Encrypts/decrypts BOTH server/.env and client/.env.local');
    rl.close();
}

/**
 * Zero-Cloud Vault Utility
 * 
 * USAGE:
 *   Encrypt: npm run encrypt
 *   Decrypt: npm run decrypt
 * 
 * This script will prompt you for a password. 
 * SHARE THIS PASSWORD PRIVATELY WITH YOUR TEAM.
 * 
 * DO NOT commit the .env file.
 * DO commit the secrets.enc file.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const ENV_FILE = path.join(__dirname, '../.env');
const VAULT_FILE = path.join(__dirname, '../secrets.enc');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askPassword(query) {
    return new Promise((resolve) => {
        rl.question(query, (ans) => {
            resolve(ans);
        });
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

async function encrypt() {
    if (!fs.existsSync(ENV_FILE)) {
        console.error('Error: .env file not found!');
        process.exit(1);
    }

    const password = await askPassword('Enter Team Password to ENCRYPT: ');
    if (!password) {
        console.error('Password cannot be empty.');
        process.exit(1);
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const content = fs.readFileSync(ENV_FILE);

    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // File structure: [salt(16)] [iv(12)] [authTag(16)] [encryptedContent]
    const vaultData = Buffer.concat([salt, iv, authTag, encrypted]);
    fs.writeFileSync(VAULT_FILE, vaultData);

    console.log('\nSUCCESS: .env has been encrypted into secrets.enc');
    console.log('You can now safely commit secrets.enc to GitHub.');
    rl.close();
}

async function decrypt() {
    if (!fs.existsSync(VAULT_FILE)) {
        console.error('Error: secrets.enc not found! Have you pulled the latest changes?');
        process.exit(1);
    }

    const password = await askPassword('Enter Team Password to DECRYPT: ');
    
    const vaultData = fs.readFileSync(VAULT_FILE);
    
    const salt = vaultData.slice(0, SALT_LENGTH);
    const iv = vaultData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = vaultData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptedContent = vaultData.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    try {
        const key = await deriveKey(password, salt);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
        fs.writeFileSync(ENV_FILE, decrypted);

        console.log('\nSUCCESS: secrets.enc has been decrypted into .env');
        console.log('Your local environment is now ready.');
    } catch (err) {
        console.error('\nERROR: Decryption failed. Incorrect password?');
    }
    rl.close();
}

const mode = process.argv[2];
if (mode === 'encrypt') {
    encrypt();
} else if (mode === 'decrypt') {
    decrypt();
} else {
    console.log('Usage: node vault.js [encrypt|decrypt]');
    rl.close();
}

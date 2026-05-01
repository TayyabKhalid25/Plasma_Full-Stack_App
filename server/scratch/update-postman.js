const fs = require('fs');
const https = require('https');

const collectionPath = '../../Combined Plasma APIs — Complete.postman_collection.json';
const collectionData = fs.readFileSync(collectionPath, 'utf8');
const collectionUID = '54201032-de0ff91f-44be-463c-a7f2-33689dbdb2b2';
const apiKey = 'PMAK-69e7991863b1df0001c9ebac-33c725bf0ed9fe5ed87cb565d1a6d8fb6c';

const options = {
  hostname: 'api.getpostman.com',
  port: 443,
  path: `/collections/${collectionUID}`,
  method: 'PUT',
  headers: {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ collection: JSON.parse(collectionData) }));
req.end();

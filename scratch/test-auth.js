async function testAuth() {
    const baseUrl = 'http://localhost:5000/api';

    console.log('--- TESTING NEW AUTH ROUTES ---\n');

    // 1. Test Login with seeded credentials
    console.log('1. Testing POST /auth/login (Wahaj)...');
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'wahaj@plasma.gg', password: 'password123' })
        });
        const loginData = await loginRes.json();
        
        if (loginData.success && loginData.token) {
            console.log('✅ LOGIN SUCCESS!');
            console.log('   User:', loginData.user.username);
            console.log('   Token received (length):', loginData.token.length);
        } else {
            console.log('❌ LOGIN FAILED:', loginData);
        }
    } catch (err) {
        console.error('❌ Fetch failed:', err.message);
    }

    console.log('\n-----------------------------------\n');

    // 2. Test Registration with a brand new user
    const randomNum = Math.floor(Math.random() * 10000);
    const testUsername = `NewGamer_${randomNum}`;
    const testEmail = `gamer${randomNum}@test.com`;

    console.log(`2. Testing POST /auth/register (Creating ${testUsername})...`);
    try {
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: testUsername, 
                email: testEmail, 
                password: 'MySecurePassword!',
                dateOfBirth: '2000-01-01'
            })
        });
        const regData = await regRes.json();
        
        if (regData.success && regData.token) {
            console.log('✅ REGISTRATION SUCCESS!');
            console.log('   New User created in Database:', regData.user.username);
            console.log('   Token received (length):', regData.token.length);
        } else {
            console.log('❌ REGISTRATION FAILED:', regData);
        }
    } catch (err) {
        console.error('❌ Fetch failed:', err.message);
    }
}

testAuth();

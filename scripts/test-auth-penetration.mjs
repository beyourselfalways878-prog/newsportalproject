import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: `test_penetrate_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Penetration Tester'
};

async function runTest() {
    console.log('🚀 Starting Auth Deep Penetration Test...');
    let token = '';
    let userId = '';

    try {
        // 1. Test Registration
        console.log('\n[1] Testing /auth/register...');
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Reg failed: ${regData.error}`);
        console.log('✅ Registration successful');
        userId = regData.data.userId;

        // 2. Test Login (Alias: signin)
        console.log('\n[2] Testing /auth/signin (Frontend Alias)...');
        const loginRes = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
        token = loginData.data.token;
        console.log('✅ Login successful');

        // 3. Test Profile Fetch (General)
        console.log('\n[3] Testing /auth/profile (Authenticated)...');
        const profRes = await fetch(`${BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profData = await profRes.json();
        if (!profRes.ok) throw new Error(`Profile fetch failed: ${profData.error}`);
        console.log('✅ Profile fetch successful');

        // 4. Test Profile Fetch (Param-based - Frontend Style)
        console.log(`\n[4] Testing /auth/profile/${userId} (Param-based)...`);
        const profParamRes = await fetch(`${BASE_URL}/auth/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profParamData = await profParamRes.json();
        if (!profParamRes.ok) throw new Error(`Param-based profile fetch failed: ${profParamData.error}`);
        console.log('✅ Param-based profile fetch successful');

        // 5. Test Unauthorized Access
        console.log('\n[5] Testing Unauthorized Access to /auth/profile...');
        const unauthRes = await fetch(`${BASE_URL}/auth/profile`);
        if (unauthRes.status === 401) {
            console.log('✅ Unauthorized access blocked correctly (401)');
        } else {
            throw new Error(`Unauthorized access allowed with status ${unauthRes.status}`);
        }

        // 6. Test Signout (Alias)
        console.log('\n[6] Testing /auth/signout (Frontend Alias)...');
        const logoutRes = await fetch(`${BASE_URL}/auth/signout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logoutRes.ok) {
            console.log('✅ Signout successful');
        } else {
            throw new Error('Signout failed');
        }

        console.log('\n🏆 ALL TESTS PASSED SUCCESSFULLY! 🏆');
        process.exit(0);

    } catch (error) {
        console.error(`\n❌ TEST FAILED: ${error.message}`);
        process.exit(1);
    }
}

runTest();

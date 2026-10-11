import fs from 'fs';

// Auto-load .env if process.env.EXPO_PUBLIC_API_URL is missing
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            if (!process.env[k.trim()]) {
                process.env[k.trim()] = v.join('=').trim();
            }
        }
    }
} catch (_e) {}

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

const { apiRequest } = await import('./src/services/api/apiClient.js');
const { API_CONFIG } = await import('./src/config/env.js');

console.log('====================================================');
console.log('  FACULTYFLOW: PRODUCTION LOGIN & CONNECTION TEST   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ [PASS] ${message}`);
    } else {
        console.error(`❌ [FAIL] ${message}`);
        process.exitCode = 1;
    }
}

async function runTests() {
    // ----------------------------------------------------
    // TEST 1: Backend Reachable from External Client
    // ----------------------------------------------------
    console.log('\n--- 1. External Backend Reachability & Health Check ---');
    try {
        const healthRes = await apiRequest('/health', { timeoutMs: 30000 });
        assert(healthRes.success === true && healthRes.database === 'connected',
            `Production backend reachable at ${API_CONFIG.BASE_URL} (db: ${healthRes.database})`);
    } catch (err) {
        assert(false, `Production backend health probe failed: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 2: Login with Valid Credentials
    // ----------------------------------------------------
    console.log('\n--- 2. Production Login with Valid Account ---');
    let validToken = null;
    let loggedInUser = null;
    try {
        const loginRes = await apiRequest('/auth/login', {
            method: 'POST',
            body: {
                email: 'faculty@test.com',
                password: 'password123'
            },
            timeoutMs: 40000,
            retry: true
        });

        assert(loginRes.success === true && typeof loginRes.accessToken === 'string',
            `Production login succeeded with JWT token generated`);
        assert(loginRes.user && loginRes.user.email === 'faculty@test.com' && loginRes.user.role === 'faculty',
            `Faculty user profile hydrated: ${loginRes.user.name} (${loginRes.user.userId})`);
        validToken = loginRes.accessToken;
        loggedInUser = loginRes.user;
    } catch (err) {
        assert(false, `Valid login failed: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 3: Login with Invalid Credentials
    // ----------------------------------------------------
    console.log('\n--- 3. Login with Invalid Credentials (Controlled 401) ---');
    try {
        await apiRequest('/auth/login', {
            method: 'POST',
            body: {
                email: 'faculty@test.com',
                password: 'wrong_password_xyz'
            },
            timeoutMs: 20000
        });
        assert(false, 'Expected 401 error but login succeeded');
    } catch (err) {
        assert(err.status === 401 && err.message === 'Invalid email or password.',
            `Rejected with controlled HTTP 401 and clean message: "${err.message}" (code: ${err.code})`);
        assert(err.isNetworkError !== true,
            '401 is cleanly classified as authentication failure, NOT network failure');
    }

    // ----------------------------------------------------
    // TEST 4: URL Path Normalization (No duplicate /api)
    // ----------------------------------------------------
    console.log('\n--- 4. URL Path Normalization Guard ---');
    try {
        const resWithPrefix = await apiRequest('/api/health', { timeoutMs: 15000 });
        assert(resWithPrefix.success === true,
            'Endpoint "/api/health" cleanly stripped duplicate "/api" and resolved successfully');
    } catch (err) {
        assert(false, `Redundant /api path test failed: ${err.message}`);
    }

    // ----------------------------------------------------
    // TEST 5: Network Timeout & Error Classification
    // ----------------------------------------------------
    console.log('\n--- 5. Timeout & Error Classification Integrity ---');
    try {
        await apiRequest('/health', { timeoutMs: 1 });
        assert(false, 'Expected timeout but request succeeded');
    } catch (err) {
        assert(err.code === 'TIMEOUT_ERROR' && err.isTimeoutError === true,
            `Timeout error correctly classified: "${err.message}" (code: ${err.code})`);
    }

    // ----------------------------------------------------
    // TEST 6: Profile Verification with Token
    // ----------------------------------------------------
    console.log('\n--- 6. Profile Verification (/auth/verify) ---');
    if (validToken) {
        try {
            const verifyRes = await apiRequest('/auth/verify', {
                method: 'GET',
                accessToken: validToken,
                timeoutMs: 15000
            });
            assert(verifyRes.success === true && verifyRes.user.userId === loggedInUser.userId,
                `Token verification succeeded for user ${verifyRes.user.userId}`);
        } catch (err) {
            assert(false, `Token verification failed: ${err.message}`);
        }
    } else {
        console.log('⚠️ Skipping /auth/verify due to missing test token');
    }

    // ----------------------------------------------------
    // TEST 7: Non-JSON / 404 Route Safety
    // ----------------------------------------------------
    console.log('\n--- 7. Non-JSON / 404 Route Safety ---');
    try {
        await apiRequest('/non-existent-route-999', { timeoutMs: 15000 });
        assert(false, 'Expected 404 for invalid route');
    } catch (err) {
        assert(err.status === 404 && (err.code === 'NOT_FOUND' || err.code === 'ROUTE_NOT_FOUND'),
            `404 route handled safely without leaking HTML: "${err.message}" (status: ${err.status})`);
    }

    // Summary
    console.log('\n====================================================');
    console.log(`  VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================');

    if (passedTests === totalTests) {
        console.log('🎉 ALL PRODUCTION CONNECTION & LOGIN TESTS PASSED!');
        process.exit(0);
    } else {
        console.error('❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

runTests();

const BASE = 'http://localhost:5000/api';

let token = '';
let userId = '';
let createdPostId = '';
let rallyId = '';
let friendId = '';

function log(emoji, label, data) {
    const sample = JSON.stringify(data).substring(0, 80);
    console.log(`${emoji} ${label}`);
    if (data !== null) console.log(`   Sample: ${sample}...`);
}

async function apiGet(path) {
    const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
}

async function apiPost(path, body) {
    const r = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
    });
    return r.json();
}

async function apiPut(path, body) {
    const r = await fetch(`${BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
    });
    return r.json();
}

async function apiDelete(path) {
    const r = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    return r.json();
}

async function runTests() {
    console.log('\n======================================');
    console.log(' PLASMA NEW ENDPOINTS - FULL TEST SUITE');
    console.log('======================================\n');

    // --- LOGIN ---
    console.log('--- Step 0: Login as Wahaj ---');
    const login = await apiPost('/auth/dev-login', { username: 'Wahaj', steamID64: '76561198000000001' });
    if (!login.token) { console.log('❌ Login failed. Aborting.'); return; }
    token = login.token;
    userId = login.user.plasmaUserID;
    console.log(`✅ Logged in as Wahaj (ID: ${userId})\n`);

    // --- USERS ---
    console.log('--- Section 1: Users ---');

    const intentRes = await apiPut('/users/me/intent', { intent: 'CHILL' });
    intentRes.success ? log('✅', 'PUT /users/me/intent (set to CHILL)', intentRes.message) : log('❌', 'PUT /users/me/intent FAILED', intentRes);

    const intentRes2 = await apiPut('/users/me/intent', { intent: 'COMPETITIVE' });
    intentRes2.success ? log('✅', 'PUT /users/me/intent (set back to COMPETITIVE)', intentRes2.message) : log('❌', 'FAILED', intentRes2);

    const profileUpdate = await apiPut('/users/me/profile', { bio: 'Backend dev. No sleep.' });
    profileUpdate.success ? log('✅', 'PUT /users/me/profile (update bio)', profileUpdate.message) : log('❌', 'PUT /users/me/profile FAILED', profileUpdate);

    const searchRes = await apiGet('/users/search?q=Ah');
    searchRes.success ? log('✅', `GET /users/search?q=Ah — Found ${searchRes.data.length} user(s)`, searchRes.data[0]) : log('❌', 'GET /users/search FAILED', searchRes);

    if (searchRes.data && searchRes.data.length > 0) {
        friendId = searchRes.data[0].plasmaUserID;
        const userProfile = await apiGet(`/users/${friendId}`);
        userProfile.success ? log('✅', `GET /users/:id (Ahmed's profile)`, userProfile.data) : log('❌', 'GET /users/:id FAILED', userProfile);
    }

    // --- FEED ---
    console.log('\n--- Section 2: Feed ---');

    const createPost = await apiPost('/feed/posts', { content: 'Test post from automated test script! 🚀', type: 'MOMENT' });
    if (createPost.success) {
        createdPostId = createPost.data.postID;
        log('✅', 'POST /feed/posts (create post)', createPost.data);
    } else {
        log('❌', 'POST /feed/posts FAILED', createPost);
    }

    if (createdPostId) {
        const deletePost = await apiDelete(`/feed/posts/${createdPostId}`);
        deletePost.success ? log('✅', `DELETE /feed/posts/:id (delete post)`, deletePost.message) : log('❌', 'DELETE /feed/posts/:id FAILED', deletePost);
    }

    // --- RALLIES ---
    console.log('\n--- Section 3: Rallies ---');

    const upcoming = await apiGet('/rallies/upcoming');
    upcoming.success ? log('✅', `GET /rallies/upcoming — Found ${upcoming.data.length} item(s)`, upcoming.data[0]) : log('❌', 'GET /rallies/upcoming FAILED', upcoming);

    const createRally = await apiPost('/rallies', {
        title: 'Test Rally from Script',
        scheduledStartUTC: new Date(Date.now() + 86400000 * 2).toISOString(),
        maxCapacity: 5,
        requiredIntent: 'CHILL'
    });
    if (createRally.success) {
        rallyId = createRally.data.eventID;
        log('✅', 'POST /rallies (create rally)', createRally.data);
    } else {
        log('❌', 'POST /rallies FAILED', createRally);
    }

    if (rallyId) {
        const rsvp = await apiPost(`/rallies/${rallyId}/rsvp`, { declaredRole: 'DPS' });
        rsvp.success ? log('✅', `POST /rallies/:id/rsvp (RSVP)`, rsvp.data) : log('❌', 'POST /rallies/:id/rsvp FAILED', rsvp);

        const cancelRsvp = await apiDelete(`/rallies/${rallyId}/rsvp`);
        cancelRsvp.success ? log('✅', `DELETE /rallies/:id/rsvp (cancel RSVP)`, cancelRsvp.message) : log('❌', 'DELETE /rallies/:id/rsvp FAILED', cancelRsvp);
    }

    // --- FRIENDS ---
    console.log('\n--- Section 4: Friends ---');

    // Try to follow Omar (no existing relationship with Wahaj)
    const omarSearch = await apiGet('/users/search?q=Omar');
    if (omarSearch.data && omarSearch.data.length > 0) {
        const omarId = omarSearch.data[0].plasmaUserID;
        const followRes = await apiPost(`/friends/request/${omarId}`, {});
        followRes.success ? log('✅', 'POST /friends/request/:userId (follow Omar)', followRes.message) : log('⚠️', 'POST /friends/request (may already exist)', followRes.message);

        const unfollowRes = await apiDelete(`/friends/${omarId}`);
        unfollowRes.success ? log('✅', 'DELETE /friends/:userId (unfollow Omar)', unfollowRes.message) : log('❌', 'DELETE /friends/:userId FAILED', unfollowRes);
    }

    // --- NOTIFICATIONS ---
    console.log('\n--- Section 5: Notifications ---');
    const notifs = await apiGet('/notifications');
    notifs.success ? log('✅', `GET /notifications — Received ${notifs.data.length} item(s)`, notifs.data[0] || 'none') : log('❌', 'GET /notifications FAILED', notifs);

    // --- MESSAGES ---
    console.log('\n--- Section 6: Messages ---');
    const convos = await apiGet('/messages');
    convos.success ? log('✅', `GET /messages — Received ${convos.data.length} conversation(s)`, convos.data[0]) : log('❌', 'GET /messages FAILED', convos);

    if (friendId) {
        const convo = await apiGet(`/messages/${friendId}`);
        convo.success ? log('✅', `GET /messages/:friendId (chat with Ahmed)`, convo.data.friend) : log('❌', 'GET /messages/:id FAILED', convo);
    }

    // --- TRENDING ---
    console.log('\n--- Section 7: Trending ---');
    const trending = await apiGet('/trending');
    trending.success ? log('✅', `GET /trending — Received ${trending.data.length} item(s)`, trending.data[0]) : log('❌', 'GET /trending FAILED', trending);

    console.log('\n======================================');
    console.log(' ALL TESTS COMPLETE');
    console.log('======================================\n');
}

runTests().catch(err => console.error('Fatal error:', err));

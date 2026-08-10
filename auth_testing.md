# Auth Testing Playbook

## JWT email/password auth (primary)

### Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique), login_attempts.identifier.

### Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"gamingsteam2003@gmail.com","password":"FormEase@Admin123"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```

### Step 3: Negative tests
- Wrong password → 401; 5 failed attempts → 429 lockout (15 min); /api/admin/* as non-admin → 403

---

## Emergent-managed Google sign-in (added v1.7)

Flow: "Continue with Google" button → auth.emergentagent.com → redirect to {origin}/dashboard#session_id=... → AuthCallback (detected synchronously via useLocation().hash in AppRoutes) → POST /api/auth/google/session {session_id} → backend calls Emergent session-data (server-side only), finds/creates user by email (gamingsteam2003@gmail.com → admin role), stores session in `user_sessions`, sets httpOnly `session_token` cookie (7d). get_current_user accepts access_token JWT OR session_token cookie/Bearer.

### Testing without a real Google account — inject a session directly:
```
mongosh --eval "
use('test_database');
var user = db.users.findOne({email: 'gamingsteam2003@gmail.com'});
var sessionToken = 'test_session_' + Date.now();
db.user_sessions.insertOne({
  user_id: user._id.toString(),
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
"
```
Then:
```
curl http://localhost:8001/api/auth/me -H "Authorization: Bearer <SESSION_TOKEN>"
```
Should return the admin user (proves session_token auth path works).

### Browser test
```
await page.context.add_cookies([{name: "session_token", value: "<SESSION_TOKEN>", domain: "<host>", path: "/", httpOnly: true, secure: true, sameSite: "None"}]);
await page.goto("<app-url>/dashboard");
```
Dashboard should load without redirect to login.

### Negative tests
- POST /api/auth/google/session with {} → 400
- POST with invalid session_id → 401
- Expired session_token → 401

### Cleanup
```
mongosh --eval "use('test_database'); db.user_sessions.deleteMany({session_token: /test_session/})"
```

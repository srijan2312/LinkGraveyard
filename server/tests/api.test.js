// tests/api.test.js
// End-to-end API tests: auth, link CRUD, ownership isolation, duplicates,
// the link checker's status classification, and history recording.
// Run with: npm test
//
// The database is an in-memory MongoDB (mongodb-memory-server), and the
// "websites" being checked are a tiny local HTTP server — so the whole
// suite is deterministic and needs no internet.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'placeholder-will-be-overridden';

let app;
let mongod;
let targetServer;
let targetPort;
let tokenA; // user A
let tokenB; // user B
let linkIdA;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  // 1. In-memory MongoDB
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);

  // 2. Fake target websites with known behaviors
  targetServer = http.createServer((req, res) => {
    if (req.url === '/ok') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('fine');
    } else if (req.url === '/moved') {
      res.writeHead(301, { Location: `http://127.0.0.1:${targetPort}/ok` });
      res.end();
    } else if (req.url === '/gone') {
      res.writeHead(404);
      res.end();
    } else if (req.url === '/broken-server') {
      res.writeHead(500);
      res.end();
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => targetServer.listen(0, '127.0.0.1', resolve));
  targetPort = targetServer.address().port;

  // 3. The app (it connects to MONGODB_URI at require time via server.js,
  //    so we stub connectDB by requiring routes directly instead).
  delete require.cache[require.resolve('../server')];
  const express = require('express');
  app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/links', require('../routes/linkRoutes'));
  app.use(require('../middleware/errorHandler'));

  // 4. Two users
  const resA = await request(app).post('/api/auth/register').send({
    name: 'User A',
    email: 'a@test.dev',
    password: 'password1',
  });
  assert.equal(resA.status, 201);
  tokenA = resA.body.token;

  const resB = await request(app).post('/api/auth/register').send({
    name: 'User B',
    email: 'b@test.dev',
    password: 'password1',
  });
  assert.equal(resB.status, 201);
  tokenB = resB.body.token;
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  targetServer.close();
});

// ---------------- Auth ----------------

test('login rejects wrong password, accepts correct one', async () => {
  const bad = await request(app).post('/api/auth/login').send({ email: 'a@test.dev', password: 'wrong' });
  assert.equal(bad.status, 401);
  assert.ok(bad.body.message.includes('Incorrect password'));

  // Unknown email gets its own clear message (not a generic 401).
  const missing = await request(app).post('/api/auth/login').send({ email: 'nobody@test.dev', password: 'password1' });
  assert.equal(missing.status, 404);
  assert.ok(missing.body.message.includes('No account found'));

  const good = await request(app).post('/api/auth/login').send({ email: 'a@test.dev', password: 'password1' });
  assert.equal(good.status, 200);
  assert.ok(good.body.token);
  assert.ok(!('password' in good.body.user)); // password must never leak
});

test('protected routes reject missing/invalid tokens', async () => {
  assert.equal((await request(app).get('/api/links')).status, 401);
  assert.equal((await request(app).get('/api/links').set('Authorization', 'Bearer junk')).status, 401);
});

test('GET /api/auth/me returns the logged-in user', async () => {
  const res = await request(app).get('/api/auth/me').set(auth(tokenA));
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'a@test.dev');
});

// ---------------- Links CRUD ----------------

test('create link validates URL and rejects duplicates', async () => {
  const bad = await request(app).post('/api/links').set(auth(tokenA)).send({ url: 'not-a-url', title: 'x' });
  assert.equal(bad.status, 400);

  const ok = await request(app)
    .post('/api/links')
    .set(auth(tokenA))
    .send({ url: `http://127.0.0.1:${targetPort}/ok`, title: 'Test page', tags: 'a, b, a' });
  assert.equal(ok.status, 201);
  assert.deepEqual(ok.body.link.tags, ['a', 'b']); // deduped + normalized
  assert.equal(ok.body.link.status, 'never_checked'); // not checked unless asked
  linkIdA = ok.body.link._id;

  const dup = await request(app)
    .post('/api/links')
    .set(auth(tokenA))
    .send({ url: `http://127.0.0.1:${targetPort}/ok`, title: 'Test page again' });
  assert.equal(dup.status, 409);
});

test('user B cannot see, edit or delete user A\'s link', async () => {
  assert.equal((await request(app).get(`/api/links/${linkIdA}`).set(auth(tokenB))).status, 404);
  assert.equal(
    (await request(app).put(`/api/links/${linkIdA}`).set(auth(tokenB)).send({ title: 'hacked' })).status,
    404
  );
  assert.equal((await request(app).delete(`/api/links/${linkIdA}`).set(auth(tokenB))).status, 404);
});

test('update link edits fields but keeps the original URL', async () => {
  const res = await request(app)
    .put(`/api/links/${linkIdA}`)
    .set(auth(tokenA))
    .send({ title: 'Renamed', category: 'Tools' });
  assert.equal(res.status, 200);
  assert.equal(res.body.link.title, 'Renamed');
  assert.equal(res.body.link.category, 'Tools');
  assert.ok(res.body.link.url.includes('/ok'));
});

// ---------------- Link checking ----------------

test('classifyResponse maps HTTP codes to statuses', async () => {
  const { classifyResponse } = require('../utils/checkUrl');

  assert.equal(classifyResponse(200, null, 'https://a.com').status, 'healthy');
  assert.equal(classifyResponse(204, null, 'https://a.com').status, 'healthy');

  const redir = classifyResponse(301, '/new-page', 'https://a.com/old-page');
  assert.equal(redir.status, 'redirected');
  assert.equal(redir.finalUrl, 'https://a.com/new-page'); // relative Location resolved

  const redirAbs = classifyResponse(302, 'https://b.com/x', 'https://a.com');
  assert.equal(redirAbs.status, 'redirected');
  assert.equal(redirAbs.finalUrl, 'https://b.com/x');

  assert.equal(classifyResponse(404, null, 'https://a.com').status, 'broken');
  assert.equal(classifyResponse(500, null, 'https://a.com').status, 'broken');
  assert.equal(classifyResponse(403, null, 'https://a.com').status, 'broken');
});

test('checkUrl blocks internal/private targets (SSRF guard)', async () => {
  const { checkUrl } = require('../utils/checkUrl');
  const base = `http://127.0.0.1:${targetPort}`;

  for (const url of [`${base}/ok`, 'http://localhost:9999/x', 'http://169.254.169.254/']) {
    const result = await checkUrl(url);
    assert.equal(result.status, 'never_checked');
    assert.ok(result.errorMessage.includes('Blocked'), `expected a Blocked message for ${url}`);
  }
});

test('checkUrl reports unresolvable domains as unknown, not broken', async () => {
  const { checkUrl } = require('../utils/checkUrl');
  const result = await checkUrl('https://this-domain-definitely-does-not-exist-98765.com');
  assert.equal(result.status, 'never_checked');
});

// ---------------- Check-all, bulk, delete ----------------

test('POST /api/links/:id/check updates the link and records history', async () => {
  const res = await request(app).post(`/api/links/${linkIdA}/check`).set(auth(tokenA));
  assert.equal(res.status, 200);
  // 127.0.0.1 is blocked by the SSRF guard -> 'never_checked', not 'healthy'.
  assert.equal(res.body.link.status, 'never_checked');
  assert.ok(res.body.link.lastChecked);

  const history = await request(app).get(`/api/links/${linkIdA}/history`).set(auth(tokenA));
  assert.equal(history.status, 200);
  assert.ok(history.body.history.length >= 1);
  assert.equal(history.body.history[0].status, 'never_checked');
});

test('POST /api/links/check-all checks every owned link', async () => {
  // Add a second link for user A
  await request(app)
    .post('/api/links')
    .set(auth(tokenA))
    .send({ url: `http://127.0.0.1:${targetPort}/gone`, title: 'Gone page' });

  const res = await request(app).post('/api/links/check-all').set(auth(tokenA)).send({});
  assert.equal(res.status, 200);
  assert.equal(res.body.checked, 2);
  assert.ok(res.body.results.every((r) => r.id && r.status));
});

test('bulk category change and bulk delete work', async () => {
  const list = await request(app).get('/api/links').set(auth(tokenA));
  const ids = list.body.links.map((l) => l._id);
  assert.ok(ids.length >= 2);

  const cat = await request(app).post('/api/links/bulk-category').set(auth(tokenA)).send({ ids, category: 'Research' });
  assert.equal(cat.status, 200);

  const del = await request(app).post('/api/links/bulk-delete').set(auth(tokenA)).send({ ids });
  assert.equal(del.status, 200);

  const after = await request(app).get('/api/links').set(auth(tokenA));
  assert.equal(after.body.links.length, 0);

  // History for deleted links is cleaned up too.
  const LinkCheckHistory = require('../models/LinkCheckHistory');
  assert.equal(await LinkCheckHistory.countDocuments({}), 0);
});

test('DELETE /api/auth/account removes the user and all their data', async () => {
  const User = require('../models/User');
  const Link = require('../models/Link');
  const LinkCheckHistory = require('../models/LinkCheckHistory');

  const userBefore = await User.findOne({ email: 'a@test.dev' });
  assert.ok(userBefore);

  // Give user A a link plus a history entry, so cascading deletion is verifiable.
  const created = await request(app)
    .post('/api/links')
    .set(auth(tokenA))
    .send({ url: 'https://example.com/gone', title: 'Temp link' });
  assert.equal(created.status, 201);
  await request(app).post(`/api/links/${created.body.link._id}/check`).set(auth(tokenA));
  assert.ok((await LinkCheckHistory.countDocuments({ user: userBefore._id })) >= 1);

  const res = await request(app).delete('/api/auth/account').set(auth(tokenA));
  assert.equal(res.status, 200);

  // No orphaned records: user, links and history are all gone.
  assert.equal(await User.countDocuments({ _id: userBefore._id }), 0);
  assert.equal(await Link.countDocuments({ user: userBefore._id }), 0);
  assert.equal(await LinkCheckHistory.countDocuments({ user: userBefore._id }), 0);

  // The old token no longer works — its user doesn't exist anymore.
  assert.equal((await request(app).get('/api/auth/me').set(auth(tokenA))).status, 401);

  // User B is untouched.
  assert.equal((await request(app).get('/api/auth/me').set(auth(tokenB))).status, 200);
});

test('stats endpoint reflects the empty state correctly', async () => {
  // User B never saved any links, so every count must be zero.
  const res = await request(app).get('/api/links/stats').set(auth(tokenB));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.stats, { total: 0, healthy: 0, redirected: 0, broken: 0, unknown: 0 });
});

// scripts/seed.js
// Optional development demo data. Run with:  npm run seed
// It creates a demo account (demo@linkgraveyard.dev / demo1234) and 10 links
// in different states so the dashboard, filters and history page have
// something realistic to show while developing.
// To start over, run: npm run seed -- --reset

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Link = require('../models/Link');
const LinkCheckHistory = require('../models/LinkCheckHistory');

const DEMO_EMAIL = 'demo@linkgraveyard.dev';
const DEMO_PASSWORD = 'demo1234';

const demoLinks = [
  { url: 'https://react.dev', title: 'React Documentation', category: 'Documentation', tags: ['react', 'frontend', 'reference'], status: 'healthy', httpStatus: 200 },
  { url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', title: 'MDN JavaScript Docs', category: 'Documentation', tags: ['javascript', 'reference'], status: 'healthy', httpStatus: 200 },
  { url: 'https://nodejs.org/en/docs', title: 'Node.js Docs', category: 'Documentation', tags: ['nodejs', 'backend'], status: 'healthy', httpStatus: 200 },
  // These two redirect — original URL stays saved, finalUrl shows the target.
  { url: 'https://github.com/something-that-moved', title: 'Old GitHub Repo Mirror', category: 'Development', tags: ['github'], status: 'redirected', httpStatus: 301, finalUrl: 'https://github.com/something-new' },
  { url: 'http://old-blog.example.org/tutorials', title: 'Old Blog Tutorials', category: 'Learning', tags: ['tutorial'], status: 'redirected', httpStatus: 302, finalUrl: 'https://new-blog.example.org/tutorials' },
  // Dead pages return real 4xx/5xx responses.
  { url: 'https://httpstat.us/404', title: 'Example Gone Page', category: 'Articles', tags: ['example'], status: 'broken', httpStatus: 404 },
  { url: 'https://httpstat.us/500', title: 'Example Broken Service', category: 'Tools', tags: ['example', 'api'], status: 'broken', httpStatus: 500 },
  { url: 'https://this-domain-should-not-exist-12345.com', title: 'Vanished Tutorial Site', category: 'Learning', tags: ['tutorial'], status: 'never_checked', httpStatus: null },
  // Never checked yet.
  { url: 'https://www.freecodecamp.org/news', title: 'freeCodeCamp News', category: 'Learning', tags: ['learning', 'free'], status: 'never_checked', httpStatus: null },
  { url: 'https://tailwindcss.com/docs', title: 'Tailwind CSS Docs', category: 'Design', tags: ['css', 'design'], status: 'never_checked', httpStatus: null },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  if (process.argv.includes('--reset')) {
    const user = await User.findOne({ email: DEMO_EMAIL });
    if (user) {
      await Link.deleteMany({ user: user._id });
      await LinkCheckHistory.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    }
    console.log('Demo data removed.');
    await mongoose.disconnect();
    return;
  }

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD });
    console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  await Link.deleteMany({ user: user._id });
  await LinkCheckHistory.deleteMany({ user: user._id });

  const now = Date.now();
  for (const demo of demoLinks) {
    const hasCheck = demo.status !== 'never_checked' || demo.httpStatus !== null;
    const link = await Link.create({
      user: user._id,
      url: demo.url,
      title: demo.title,
      description: 'Demo link — delete me whenever you like.',
      category: demo.category,
      tags: demo.tags,
      status: demo.status,
      httpStatus: demo.httpStatus,
      finalUrl: demo.finalUrl || null,
      lastChecked: hasCheck ? new Date(now - Math.floor(Math.random() * 72) * 3600000) : null,
    });

    if (hasCheck) {
      // Two history entries per checked link so the history page shows change over time.
      await LinkCheckHistory.create({
        link: link._id,
        user: user._id,
        status: 'healthy',
        httpStatus: 200,
        checkedAt: new Date(now - 30 * 24 * 3600000),
      });
      await LinkCheckHistory.create({
        link: link._id,
        user: user._id,
        status: demo.status,
        httpStatus: demo.httpStatus,
        finalUrl: demo.finalUrl || null,
        checkedAt: link.lastChecked,
      });
    }
  }

  console.log(`Seeded ${demoLinks.length} demo links for ${DEMO_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

// controllers/linkController.js
// All link operations. Two rules govern every function here:
//   1. The user ALWAYS comes from req.user (the verified JWT) — never from
//      the request body. This is what keeps User A away from User B's links.
//   2. Every database query includes { user: req.user._id } so a user can
//      only ever read, change or delete their own links.

const Link = require('../models/Link');
const LinkCheckHistory = require('../models/LinkCheckHistory');
const { checkUrl } = require('../utils/checkUrl');
const { normalizeUrl, isValidUrl } = require('../utils/validateUrl');

const DEFAULT_CATEGORIES = [
  'Development',
  'Programming',
  'Learning',
  'Documentation',
  'Tools',
  'Articles',
  'Research',
  'Career',
  'Design',
  'Other',
];

// After any check, update the link AND write a history entry.
// Keeping this in one helper avoids duplicated code in the
// "check one" and "check all" endpoints.
async function applyCheckResult(link, result) {
  link.status = result.status;
  link.httpStatus = result.httpStatus;
  link.finalUrl = result.finalUrl;
  link.responseTime = result.responseTime;
  link.lastChecked = new Date();
  await link.save();

  await LinkCheckHistory.create({
    link: link._id,
    user: link.user,
    status: result.status,
    httpStatus: result.httpStatus,
    finalUrl: result.finalUrl,
    responseTime: result.responseTime,
    errorMessage: result.errorMessage,
  });
}

// GET /api/links
// Query params: search, status, category, sort, page, limit
async function getLinks(req, res, next) {
  try {
    const { search, status, category, sort } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const filter = { user: req.user._id };

    if (status && ['healthy', 'redirected', 'broken', 'never_checked'].includes(status)) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      // One text box searches title, URL, description and tags.
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { url: regex }, { description: regex }, { tags: regex }];
    }

    // Sensible sort options; newest first is the default.
    let sortBy = { createdAt: -1 };
    if (sort === 'oldest') sortBy = { createdAt: 1 };
    else if (sort === 'recently-checked') sortBy = { lastChecked: -1 };
    else if (sort === 'status') sortBy = { status: 1, createdAt: -1 };

    const [links, total] = await Promise.all([
      Link.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
      Link.countDocuments(filter),
    ]);

    res.json({
      links,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/links/stats
// Powers the dashboard cards and health chart. One aggregate query is cheaper
// than fetching every link and counting in JavaScript.
async function getStats(req, res, next) {
  try {
    const counts = await Link.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = { total: 0, healthy: 0, redirected: 0, broken: 0, unknown: 0 };
    for (const row of counts) {
      stats.total += row.count;
      if (Object.prototype.hasOwnProperty.call(stats, row._id)) {
        stats[row._id] = row.count;
      }
    }

    // The most recently broken links, for the "Recently broken" dashboard card.
    const recentBroken = await Link.find({ user: req.user._id, status: 'broken' })
      .sort({ lastChecked: -1 })
      .limit(5);

    res.json({ stats, recentBroken });
  } catch (err) {
    next(err);
  }
}

// GET /api/links/categories
// Custom categories come from the user's own links; defaults always exist.
async function getCategories(req, res, next) {
  try {
    const used = await Link.distinct('category', { user: req.user._id });
    const categories = [...new Set([...DEFAULT_CATEGORIES, ...used])].sort();
    res.json({ categories, defaults: DEFAULT_CATEGORIES });
  } catch (err) {
    next(err);
  }
}

// GET /api/links/:id
async function getLink(req, res, next) {
  try {
    // The { user: ... } filter is the ownership check: if the link belongs
    // to someone else, this returns null and we answer 404. We do NOT say
    // "forbidden" — revealing that a link exists would leak information.
    const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }
    res.json({ link });
  } catch (err) {
    next(err);
  }
}

// POST /api/links
// body: { url, title, description, category, tags, checkNow }
async function createLink(req, res, next) {
  try {
    const { url, title, description, category, tags, checkNow } = req.body;

    if (!url || !title) {
      return res.status(400).json({ message: 'URL and title are required.' });
    }
    if (!isValidUrl(url)) {
      return res.status(400).json({ message: 'Please provide a valid http(s) URL.' });
    }

    const normalized = normalizeUrl(url);

    // Duplicate guard: same user + same URL. Mongoose's unique index is the
    // last line of defense; we check here first for a friendly message.
    const duplicate = await Link.findOne({ user: req.user._id, url: normalized });
    if (duplicate) {
      return res.status(409).json({ message: 'This URL is already saved in your collection.' });
    }

    // Tags may arrive as "a, b, c" or ["a", "b"] — accept both, clean both.
    let tagList = [];
    if (Array.isArray(tags)) tagList = tags;
    else if (typeof tags === 'string') tagList = tags.split(',');
    tagList = [...new Set(tagList.map((t) => t.trim().toLowerCase()).filter(Boolean))];

    const link = await Link.create({
      user: req.user._id,
      url: normalized,
      title: title.trim(),
      description: (description || '').trim(),
      category: (category || 'Other').trim() || 'Other',
      tags: tagList,
    });

    // Optional immediate check: the frontend can pass checkNow: true to see
    // the link's health right after saving it.
    if (checkNow) {
      const result = await checkUrl(normalized);
      await applyCheckResult(link, result);
      const updated = await Link.findById(link._id);
      return res.status(201).json({ link: updated });
    }

    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
}

// PUT /api/links/:id
// body: { title, description, category, tags }  (URL itself is NOT editable —
// the original saved URL is preserved by design, see the spec section 19)
async function updateLink(req, res, next) {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const { title, description, category, tags } = req.body;

    if (title !== undefined) link.title = title.trim();
    if (description !== undefined) link.description = String(description).trim();
    if (category !== undefined) link.category = category.trim() || 'Other';

    if (tags !== undefined) {
      let tagList = Array.isArray(tags) ? tags : String(tags).split(',');
      link.tags = [...new Set(tagList.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    }

    await link.save();
    res.json({ link });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/links/:id
async function deleteLink(req, res, next) {
  try {
    const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    // History entries are meaningless without their link, so they go too.
    await LinkCheckHistory.deleteMany({ link: link._id });

    res.json({ message: 'Link deleted.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/links/:id/check
// The "Check Now" button: re-check one link, update it, record history.
async function checkLink(req, res, next) {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const result = await checkUrl(link.url);
    await applyCheckResult(link, result);

    // Re-read so the response carries the freshly saved fields (e.g. lastChecked).
    const updated = await Link.findById(link._id);
    res.json({ link: updated, check: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/links/check-all
// body: { ids? } — if ids are given, only those links are checked.
// Sequential-ish: we check 3 at a time so a large collection does not
// flood the server or the user's machine, but it still finishes quickly.
async function checkAllLinks(req, res, next) {
  try {
    const { ids } = req.body || {};

    const filter = { user: req.user._id };
    if (Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
    }

    const links = await Link.find(filter);
    const results = [];
    const CONCURRENCY = 3;

    for (let i = 0; i < links.length; i += CONCURRENCY) {
      const batch = links.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (link) => {
          const result = await checkUrl(link.url);
          await applyCheckResult(link, result);
          return { id: link._id, title: link.title, ...result };
        })
      );
      results.push(...batchResults);
    }

    res.json({ checked: results.length, results });
  } catch (err) {
    next(err);
  }
}

// POST /api/links/bulk-delete  { ids: [...] }
async function bulkDelete(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Select at least one link.' });
    }

    const result = await Link.deleteMany({ _id: { $in: ids }, user: req.user._id });
    await LinkCheckHistory.deleteMany({ link: { $in: ids }, user: req.user._id });

    res.json({ message: `${result.deletedCount} link(s) deleted.` });
  } catch (err) {
    next(err);
  }
}

// POST /api/links/bulk-category  { ids: [...], category: "..." }
async function bulkCategory(req, res, next) {
  try {
    const { ids, category } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !category) {
      return res.status(400).json({ message: 'Select links and a category.' });
    }

    const result = await Link.updateMany(
      { _id: { $in: ids }, user: req.user._id },
      { $set: { category: category.trim() || 'Other' } }
    );

    res.json({ message: `${result.modifiedCount} link(s) updated.` });
  } catch (err) {
    next(err);
  }
}

// GET /api/links/:id/history
// Every past check for one link, newest first — the "Link History" feature.
async function getHistory(req, res, next) {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const history = await LinkCheckHistory.find({ link: link._id }).sort({ checkedAt: -1 }).limit(100);

    res.json({ link: { _id: link._id, title: link.title, url: link.url }, history });
  } catch (err) {
    next(err);
  }
}

// GET /api/links/history/recent
// Flat feed of the user's latest checks across ALL links — powers the
// "Link History" nav page (recent activity).
async function getRecentHistory(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const [history, total] = await Promise.all([
      LinkCheckHistory.find({ user: req.user._id })
        .populate('link', 'title url')
        .sort({ checkedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      LinkCheckHistory.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      history,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLinks,
  getStats,
  getCategories,
  getLink,
  createLink,
  updateLink,
  deleteLink,
  checkLink,
  checkAllLinks,
  bulkDelete,
  bulkCategory,
  getHistory,
  getRecentHistory,
};

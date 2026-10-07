// routes/linkRoutes.js
// URL paths for everything link-related. The auth middleware runs FIRST on
// every route here, so req.user is always the verified user in controllers.
// NOTE on order: routes like /stats and /history/recent must be registered
// BEFORE /:id, otherwise Express would treat "stats" as a link id.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
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
} = require('../controllers/linkController');

router.use(auth); // every link route is private

router.get('/stats', getStats);
router.get('/categories', getCategories);
router.get('/history/recent', getRecentHistory);

router.get('/', getLinks);
router.post('/', createLink);
router.post('/check-all', checkAllLinks);
router.post('/bulk-delete', bulkDelete);
router.post('/bulk-category', bulkCategory);

router.get('/:id', getLink);
router.put('/:id', updateLink);
router.delete('/:id', deleteLink);
router.post('/:id/check', checkLink);
router.get('/:id/history', getHistory);

module.exports = router;

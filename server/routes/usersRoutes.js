const express = require('express');
const {
  disconnectAccountLink,
  getAccountLinks,
  getMe,
  getMyExternalActivity,
  getMyRatingHistory,
  syncMyExternalActivity,
  updateMe,
} = require('../controllers/usersController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMe);
router.get('/me/account-links', authMiddleware, getAccountLinks);
router.get('/me/activity/history', authMiddleware, getMyRatingHistory);
router.get('/me/activity', authMiddleware, getMyExternalActivity);
router.post('/me/activity/sync', authMiddleware, syncMyExternalActivity);
router.delete('/me/account-links/:platform', authMiddleware, disconnectAccountLink);

module.exports = router;

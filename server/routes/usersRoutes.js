const express = require('express');
const {
  disconnectAccountLink,
  getMe,
  getMyExternalActivity,
  syncMyExternalActivity,
} = require('../controllers/usersController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.get('/me/activity', authMiddleware, getMyExternalActivity);
router.post('/me/activity/sync', authMiddleware, syncMyExternalActivity);
router.delete('/me/account-links/:platform', authMiddleware, disconnectAccountLink);

module.exports = router;

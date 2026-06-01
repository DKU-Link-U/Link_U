const express = require('express');
const { disconnectAccountLink, getMe } = require('../controllers/usersController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.delete('/me/account-links/:platform', authMiddleware, disconnectAccountLink);

module.exports = router;

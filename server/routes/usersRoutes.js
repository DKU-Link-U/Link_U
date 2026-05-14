const express = require('express');
const { getMe } = require('../controllers/usersController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);

module.exports = router;

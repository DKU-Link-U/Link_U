const express = require('express');
const { startGoogleLogin, handleGoogleCallback } = require('../controllers/authController');

const router = express.Router();

router.get('/google', startGoogleLogin);
router.get('/google/callback', handleGoogleCallback);

module.exports = router;

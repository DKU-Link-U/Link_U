const express = require('express');
const {
  handleGithubCallback,
  handleGoogleCallback,
  startGithubLink,
  startGoogleLogin,
} = require('../controllers/authController');

const router = express.Router();

router.get('/google', startGoogleLogin);
router.get('/google/callback', handleGoogleCallback);
router.get('/github', startGithubLink);
router.get('/github/callback', handleGithubCallback);

module.exports = router;

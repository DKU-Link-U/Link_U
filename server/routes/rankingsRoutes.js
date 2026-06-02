const express = require('express');
const { getRankingUser, listRankings } = require('../controllers/rankingsController');

const router = express.Router();

router.get('/', listRankings);
router.get('/users/:userId', getRankingUser);

module.exports = router;

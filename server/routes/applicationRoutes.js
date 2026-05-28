const express = require('express');
const { updateApplicationStatus } = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.patch('/:id/status', authMiddleware, updateApplicationStatus);

module.exports = router;

const express = require('express');
const {
  getMessages,
  markMessageRead,
  sendMessage,
} = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);
router.patch('/:id/read', authMiddleware, markMessageRead);

module.exports = router;

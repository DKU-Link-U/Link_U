const express = require('express');
const {
  createRecruitment,
  deleteRecruitment,
  getRecruitmentById,
  getRecruitments,
  updateRecruitment,
} = require('../controllers/recruitmentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getRecruitments);
router.get('/:id', getRecruitmentById);
router.post('/', authMiddleware, createRecruitment);
router.patch('/:id', authMiddleware, updateRecruitment);
router.delete('/:id', authMiddleware, deleteRecruitment);

module.exports = router;

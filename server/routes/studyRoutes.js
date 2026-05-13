const express = require('express');
const { createCommunityController } = require('../controllers/communityController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const studyController = createCommunityController('STUDY');

router.get('/', studyController.getList);
router.get('/:id', studyController.getDetail);
router.post('/', authMiddleware, studyController.create);
router.post('/:id/applications', authMiddleware, studyController.apply);

module.exports = router;

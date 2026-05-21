const express = require('express');
const { createCommunityController } = require('../controllers/communityController');
const { recommendStudies } = require('../controllers/studyAiController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const studyController = createCommunityController('STUDY');

router.get('/', studyController.getList);
router.post('/ai-recommendations', authMiddleware, recommendStudies);
router.get('/:id', studyController.getDetail);
router.post('/', authMiddleware, studyController.create);
router.post('/:id/applications', authMiddleware, studyController.apply);
router.get('/:id/applications', authMiddleware, studyController.getApplications);

module.exports = router;

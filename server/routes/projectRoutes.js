const express = require('express');
const { createCommunityController } = require('../controllers/communityController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const projectController = createCommunityController('PROJECT');

router.get('/', projectController.getList);
router.get('/:id', projectController.getDetail);
router.post('/', authMiddleware, projectController.create);

module.exports = router;

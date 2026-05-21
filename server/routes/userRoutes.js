const express = require('express');
const { getIntegratedUserData } = require('../controllers/userController');

const router = express.Router();

router.get('/:githubId/:bojId/:dhId', getIntegratedUserData);

module.exports = router;

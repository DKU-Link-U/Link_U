const express = require('express');
const { verifyExternalAccount } = require('../controllers/verificationController');

const router = express.Router();

router.get('/', verifyExternalAccount);

module.exports = router;

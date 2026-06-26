const express = require('express');
const router = express.Router();
const { getInstitutions } = require('../controllers/institutionController');

router.get('/', getInstitutions);

module.exports = router;

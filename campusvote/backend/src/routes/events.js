const express = require('express');
const router = express.Router();
const { getEvents, getEventById, castVote } = require('../controllers/eventController');
const { authenticateStudent } = require('../middleware/auth');

router.get('/', authenticateStudent, getEvents);
router.get('/:eventId', authenticateStudent, getEventById);
router.post('/:eventId/vote', authenticateStudent, castVote);

module.exports = router;

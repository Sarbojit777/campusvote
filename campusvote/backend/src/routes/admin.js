const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateAdmin } = require('../middleware/auth');
const {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addCandidate,
  deleteCandidate,
  publishResults,
  getEventStats,
} = require('../controllers/adminController');

router.use(authenticateAdmin);

router.get('/events', listEvents);
router.post('/events', createEvent);
router.put('/events/:eventId', updateEvent);
router.delete('/events/:eventId', deleteEvent);

router.post('/events/:eventId/candidates', upload.single('photo'), addCandidate);
router.delete('/events/:eventId/candidates/:candidateId', deleteCandidate);

router.post('/events/:eventId/publish-results', publishResults);
router.get('/events/:eventId/stats', getEventStats);

module.exports = router;

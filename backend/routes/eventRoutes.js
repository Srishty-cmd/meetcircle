const express = require('express');
const {
  createEvent,
  getEvents,
  getJoinedEvents,
  getMyEvents,
  joinEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.get('/my-events', protect, getMyEvents);
router.get('/joined-events', protect, getJoinedEvents);
router.post('/create', protect, createEvent);
router.post('/join/:eventId', protect, joinEvent);

module.exports = router;

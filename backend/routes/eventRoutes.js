const express = require('express');
const {
  createEvent,
  getEvents,
  getJoinedEvents,
  getMyEvents,
  joinEvent,
  updateEvent,
  deleteEvent,
  removeParticipant,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getEvents);
router.get('/my-events', protect, getMyEvents);
router.get('/joined-events', protect, getJoinedEvents);
router.post('/create', protect, createEvent);
router.post('/join/:eventId', protect, joinEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.delete('/:eventId/participants/:participantId', protect, removeParticipant);

module.exports = router;

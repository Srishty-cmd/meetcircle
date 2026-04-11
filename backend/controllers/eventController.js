const Event = require('../models/Event');

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body;

    if (!title || !description || !date || !location || !category) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      category,
      createdBy: req.user._id,
      participants: [req.user._id],
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create event' });
  }
};

const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const alreadyJoined = event.participants.some(
      (participantId) => participantId.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this event' });
    }

    event.participants.push(req.user._id);
    await event.save();

    return res.status(200).json({ message: 'Joined event successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to join event' });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch created events' });
  }
};

const getJoinedEvents = async (req, res) => {
  try {
    const events = await Event.find({ participants: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(events);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch joined events' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the event creator can edit this event' });
    }

    const { title, description, date, location, category } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (location !== undefined) event.location = location;
    if (category !== undefined) event.category = category;

    await event.save();
    return res.status(200).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update event' });
  }
};

module.exports = {
  getEvents,
  createEvent,
  joinEvent,
  getMyEvents,
  getJoinedEvents,
  updateEvent,
};

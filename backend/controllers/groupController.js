const Group = require('../models/Group');
const Message = require('../models/Message');

// Fetch all groups where user is a member or open to join
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
};

// Create a new group (Core only)
const createGroup = async (req, res) => {
  try {
    if (req.user.role !== 'core') {
      return res.status(403).json({ message: 'Only Core members can create groups' });
    }
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    const newGroup = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    await newGroup.populate('createdBy', 'name email role');
    await newGroup.populate('members', 'name email role');

    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group' });
  }
};

// Join group (Core or Volunteer)
const joinGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.some(m => m.toString() === req.user._id.toString())) {
      group.members.push(req.user._id);
      await group.save();
    }
    
    await group.populate('createdBy', 'name email role');
    await group.populate('members', 'name email role');
    
    res.status(200).json({ message: 'Joined group successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join group' });
  }
};

// Leave group
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();
    
    await group.populate('createdBy', 'name email role');
    await group.populate('members', 'name email role');
    
    res.status(200).json({ message: 'Left group successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave group' });
  }
};

// Fetch messages for a specific group
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await Message.find({ groupId: id }).populate('sender', 'name email role').sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Upload a file and create a message
const uploadFileMessage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { mimetype, filename, originalname } = req.file;
    let fileType = 'none';
    if (mimetype.startsWith('image/')) fileType = 'image';
    else if (mimetype.startsWith('video/')) fileType = 'video';
    else if (mimetype === 'application/pdf') fileType = 'pdf';

    const fileUrl = `/uploads/${filename}`;

    const newMessage = await Message.create({
      groupId: id,
      sender: req.user._id,
      text: '',
      fileUrl,
      fileType,
      originalFileName: originalname,
    });

    const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name email role');
    
    res.status(201).json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload file message' });
  }
};

// Remove a participant (Core only)
const removeMember = async (req, res) => {
  try {
    if (req.user.role !== 'core') {
      return res.status(403).json({ message: 'Only Core members can remove participants' });
    }
    const { id, memberId } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (req.user._id.toString() === memberId) {
      return res.status(400).json({ message: 'Use leave group to remove yourself' });
    }

    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();
    
    await group.populate('createdBy', 'name email role');
    await group.populate('members', 'name email role');
    
    res.status(200).json({ message: 'Removed participant successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove participant' });
  }
};

// Delete a message (Core only)
const deleteMessage = async (req, res) => {
  try {
    if (req.user.role !== 'core') {
      return res.status(403).json({ message: 'Only Core members can delete messages' });
    }
    const { id, messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, groupId: id });
    if (!message) return res.status(404).json({ message: 'Message not found in this group' });

    await Message.deleteOne({ _id: messageId });
    
    // In a real production app we'd also unlink the uploaded file from the file system
    // if the message contained a fileUrl, but this is fine for now.

    res.status(200).json({ message: 'Message deleted successfully', messageId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

module.exports = {
  getGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  getMessages,
  uploadFileMessage,
  removeMember,
  deleteMessage,
};

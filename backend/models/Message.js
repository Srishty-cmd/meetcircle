const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'pdf', 'none'],
    default: 'none',
  },
  originalFileName: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);

const mongoose = require('mongoose');

const eventPrepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: '',
    },
    blueprint: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    linkedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventPrep', eventPrepSchema);

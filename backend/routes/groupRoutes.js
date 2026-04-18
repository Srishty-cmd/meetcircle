const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  getMessages,
  uploadFileMessage,
  removeMember,
  deleteMessage,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, MP4 and PDF files are allowed.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB max

router.get('/', protect, getGroups);
router.post('/create', protect, createGroup);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/leave', protect, leaveGroup);
router.delete('/:id/members/:memberId', protect, removeMember);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages/upload', protect, upload.single('file'), uploadFileMessage);
router.delete('/:id/messages/:messageId', protect, deleteMessage);

module.exports = router;

const express = require('express');
const {
  chatPrep,
  savePrep,
  listMine,
  getById,
  removePrep,
} = require('../controllers/eventPrepController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/chat', protect, chatPrep);
router.post('/save', protect, savePrep);
router.get('/mine', protect, listMine);
router.get('/mine/', protect, listMine);
router.delete('/:id', protect, removePrep);
router.get('/:id', protect, getById);

module.exports = router;

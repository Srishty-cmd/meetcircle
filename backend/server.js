const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');
const eventPrepRoutes = require('./routes/eventPrepRoutes');
const groupRoutes = require('./routes/groupRoutes');
const Message = require('./models/Message');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Community Event Platform API is running' });
});

app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/event-prep', eventPrepRoutes);
app.use('/api/groups', groupRoutes);

io.on('connection', (socket) => {
  socket.on('joinRoom', (groupId) => {
    socket.join(groupId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      if (data.fileUrl) { // if the message was uploaded via REST as a file, we just emit it
        io.to(data.groupId).emit('message', data);
      } else {
        const { groupId, sender, text } = data;
        const newMsg = await Message.create({
          groupId,
          sender,
          text,
        });
        const populatedMsg = await Message.findById(newMsg._id).populate('sender', 'name email role');
        io.to(groupId).emit('message', populatedMsg);
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('messageDeleted', (data) => {
    io.to(data.groupId).emit('messageDeleted', data.messageId);
  });

  socket.on('memberRemoved', (data) => {
    io.to(data.groupId).emit('memberRemoved', data.memberId);
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

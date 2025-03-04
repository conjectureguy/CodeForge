const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');

// Import existing route modules and the new community routes
const authRoutes = require('./routes/auth');
const contestRoutes = require('./routes/contest');
const profileRoutes = require('./routes/profile');
const communityRoutes = require('./routes/community');

const app = express();
mongo_uri = dotenv.config().parsed.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(mongo_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use existing and community routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/community', communityRoutes);

// Create an HTTP server and attach Socket.io for real-time updates
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available in all routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');
const teamRoutes = require('./routes/team');

// Load env variables
dotenv.config();
const mongo_uri = process.env.MONGO_URI;

const authRoutes = require('./routes/auth');
const contestRoutes = require('./routes/contest');
const profileRoutes = require('./routes/profile');
const communityRoutes = require('./routes/community');

const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(mongo_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/teams', teamRoutes);


// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

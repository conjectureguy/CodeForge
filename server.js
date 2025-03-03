// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route modules
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB (adjust the URI as needed)
mongoose.connect('mongodb://localhost:27017/forcecodes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use the authentication and profile routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Additional routes (if any) can be added here.
// const contestRoutes = require('./routes/contest');
// app.use('/contests', contestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

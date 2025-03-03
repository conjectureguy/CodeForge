// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route modules
const authRoutes = require('./routes/auth');
const contestRoutes = require('./routes/contest');
// Optionally, add other route imports (e.g., user, friends)
// const userRoutes = require('./routes/user');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB (adjust the URI as needed)
mongoose.connect('mongodb://localhost:27017/codeforge', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Use the authentication routes for login/challenge flow
app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);

// // In your app.js/server.js
// const contestRoutes = require('./routes/contest');
// app.use('/contests', contestRoutes);

// If you have additional routes (for example, user or friend management), add them here:
// app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

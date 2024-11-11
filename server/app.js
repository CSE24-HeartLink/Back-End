// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const notifyRoutes = require('./routes/notifyRoutes');
const feedRoutes = require('./routes/feedRoutes');
const groupRoutes = require('./routes/groupRoutes');
const cloiRoutes = require('./routes/cloiRoutes');
const friendRoutes = require('./routes/friendRoutes');
const albumRoutes = require('./routes/albumRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/cloi', cloiRoutes);
app.use('/api/friend', friendRoutes);
app.use('/api/album', albumRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
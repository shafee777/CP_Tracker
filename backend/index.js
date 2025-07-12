//index.js
const express = require('express');
const cors = require('cors');
const connectdb=require('./models/connectdb');
const app = express();
const PORT = 3000;
const lcPredictionRoute = require('./routes/LC_prediction');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
connectdb();

// Routes
const authRoutes = require('./Login/auth');
const leetcodeRoutes = require('./routes/leetcode');
const contestRoutes = require('./routes/contests');
const codechefRoutes = require('./routes/codechef');
const codeforceRoutes = require('./routes/codeforce');
const allplatformRoutes = require('./routes/allplatform');
const userRoutes = require('./routes/user');
const recommendRoute = require("./routes/recommend");

app.use('/api/users', userRoutes);
app.use('/user', leetcodeRoutes);
app.use('/api/lccn', lcPredictionRoute);
app.use('/api/auth', authRoutes);
// app.use('/leetcode', leetcodeRoutes);
// app.use('/api/leetcode', leetcodeRoutes);
app.use('/contests', contestRoutes);
app.use('/codechef', codechefRoutes);
app.use('/api/codeforces', codeforceRoutes);
app.use('/all', allplatformRoutes);
app.use('/recommend', recommendRoute);


// Default route
app.get('/', (req, res) => {
  res.send("LeetCode API is running. Use /user/:username");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

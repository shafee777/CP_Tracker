// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/login');


router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const exists = await User.exists({ username: username.trim() });
    res.json({ exists: !!exists });
  } catch (error) {
    console.error('Error checking username:', error.message);
    res.status(500).json({ error: 'Server error checking username' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };       
    const current = await User.findById(id);
    if (!current) return res.status(404).json({ error: 'User not found' });
    if (update.username) update.username = update.username.trim();

    Object.keys(update).forEach(key => {
      if (update[key] === undefined || update[key] === current[key]) {
        delete update[key];
      }
    });
    if (update.username) {
      const clash = await User.findOne({ username: update.username });
      if (clash && clash._id.toString() !== id)
        return res.status(400).json({ error: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    res.json(user);
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ error: err.message || 'Update failed' });
  }
});





module.exports = router;

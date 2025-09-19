const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const redis = require('../config/redis');
const { protect } = require('../middleware/auth');

const router = express.Router();


router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, first_name, last_name } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      email,
      password_hash: password, 
      first_name,
      last_name
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'devops-secret-key',
      { expiresIn: '7d' }
    );

    await redis.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toJSON()));

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});


router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('Login attempt for email:', email);
    const user = await User.findOne({ email });

    console.log('User found:', !!user);
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing password:', password, 'with hash:', user.password_hash);
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'devops-secret-key',
      { expiresIn: '7d' }
    );

    await redis.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toJSON()));

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});


router.get('/me', protect, async (req, res) => {
  try {
    const cachedUser = await redis.get(`user:${req.user.id}`);
    
    if (cachedUser) {
      return res.json({
        success: true,
        user: JSON.parse(cachedUser)
      });
    }

    const user = await User.findById(req.user.id).select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await redis.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toJSON()));

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/logout', protect, async (req, res) => {
  try {
    await redis.del(`user:${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;

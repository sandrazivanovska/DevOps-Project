const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const redis = require('../config/redis');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const cacheKey = `users:${page}:${limit}`;
    const cachedUsers = await redis.get(cacheKey);

    if (cachedUsers) {
      return res.json({
        success: true,
        data: JSON.parse(cachedUsers)
      });
    }

    const users = await User.find()
      .select('-password_hash')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(offset);

    const total = await User.countDocuments();

    const response = {
      users: users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    };

    await redis.setEx(cacheKey, 300, JSON.stringify(response));

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    const cachedUser = await redis.get(`user:${id}`);

    if (cachedUser) {
      return res.json({
        success: true,
        data: JSON.parse(cachedUser)
      });
    }

    const user = await User.findById(id).select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await redis.setEx(`user:${id}`, 600, JSON.stringify(user));

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', protect, [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please include a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { first_name, last_name, email } = req.body;

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      const emailCheck = await User.findOne({ email, _id: { $ne: id } });
      if (emailCheck) {
        return res.status(400).json({ message: 'Email already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(first_name && { first_name }),
          ...(last_name && { last_name }),
          ...(email && { email })
        }
      },
      { new: true, runValidators: true }
    ).select('-password_hash');

    await redis.del(`user:${id}`);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id/password', protect, [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { current_password, new_password } = req.body;

    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to change this user\'s password' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password_hash = new_password;
    await user.save();

    await redis.del(`user:${id}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await redis.del(`user:${id}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

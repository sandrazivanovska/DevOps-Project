const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();


router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, table_name, action, user_id } = req.query;
    const offset = (page - 1) * limit;

    let query = {};

    if (table_name) {
      query.table_name = table_name;
    }

    if (action) {
      query.action = action;
    }

    if (user_id) {
      query.user_id = user_id;
    }

    const logs = await AuditLog.find(query)
      .populate('user_id', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(offset);

    const total = await AuditLog.countDocuments(query);

    const response = {
      logs: logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id)
      .populate('user_id', 'username email');

    if (!log) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const actionStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { action: '$_id', count: 1, _id: 0 } }
    ]);

    const tableStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$table_name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { table_name: '$_id', count: 1, _id: 0 } }
    ]);

    const userStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', email: '$user.email', activity_count: '$count', _id: 0 } }
    ]);

    const dailyStats = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        action_stats: actionStats,
        table_stats: tableStats,
        user_stats: userStats,
        daily_stats: dailyStats,
        period_days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

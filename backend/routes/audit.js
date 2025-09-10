const express = require('express');
const db = require('../config/database');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get audit logs
// @route   GET /api/audit
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, table_name, action, user_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, u.username, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (table_name) {
      paramCount++;
      query += ` AND al.table_name = $${paramCount}`;
      queryParams.push(table_name);
    }

    if (action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      queryParams.push(action);
    }

    if (user_id) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      queryParams.push(user_id);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM audit_logs al WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (table_name) {
      countParamCount++;
      countQuery += ` AND al.table_name = $${countParamCount}`;
      countParams.push(table_name);
    }

    if (action) {
      countParamCount++;
      countQuery += ` AND al.action = $${countParamCount}`;
      countParams.push(action);
    }

    if (user_id) {
      countParamCount++;
      countQuery += ` AND al.user_id = $${countParamCount}`;
      countParams.push(user_id);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const response = {
      logs: result.rows,
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

// @desc    Get audit log by ID
// @route   GET /api/audit/:id
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT al.*, u.username, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get audit statistics
// @route   GET /api/audit/stats
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get action statistics
    const actionStats = await db.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY action
      ORDER BY count DESC
    `);

    // Get table statistics
    const tableStats = await db.query(`
      SELECT table_name, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY table_name
      ORDER BY count DESC
    `);

    // Get user activity
    const userStats = await db.query(`
      SELECT u.username, u.email, COUNT(al.id) as activity_count
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY u.id, u.username, u.email
      ORDER BY activity_count DESC
      LIMIT 10
    `);

    // Get daily activity
    const dailyStats = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: {
        action_stats: actionStats.rows,
        table_stats: tableStats.rows,
        user_stats: userStats.rows,
        daily_stats: dailyStats.rows,
        period_days: parseInt(days)
      }
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

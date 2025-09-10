const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const redis = require('../config/redis');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.username, u.email, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    // Regular users can only see their own orders
    if (req.user.role !== 'admin') {
      paramCount++;
      query += ` AND o.user_id = $${paramCount}`;
      queryParams.push(req.user.id);
    }

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), offset);

    const result = await db.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM orders o WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (req.user.role !== 'admin') {
      countParamCount++;
      countQuery += ` AND o.user_id = $${countParamCount}`;
      countParams.push(req.user.id);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND o.status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const response = {
      orders: result.rows,
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
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT o.*, u.username, u.email, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const queryParams = [id];

    // Regular users can only see their own orders
    if (req.user.role !== 'admin') {
      query += ` AND o.user_id = $2`;
      queryParams.push(req.user.id);
    }

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await db.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    order.items = itemsResult.rows;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isInt().withMessage('Product ID must be a number'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shipping_address').notEmpty().withMessage('Shipping address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shipping_address } = req.body;

    // Start transaction
    await db.query('BEGIN');

    try {
      let totalAmount = 0;
      const orderItems = [];

      // Validate products and calculate total
      for (const item of items) {
        const productResult = await db.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
        
        if (productResult.rows.length === 0) {
          await db.query('ROLLBACK');
          return res.status(400).json({ message: `Product with ID ${item.product_id} not found` });
        }

        const product = productResult.rows[0];

        if (product.stock_quantity < item.quantity) {
          await db.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}` 
          });
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price
        });
      }

      // Create order
      const orderResult = await db.query(
        'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, totalAmount, shipping_address]
      );

      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of orderItems) {
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [order.id, item.product_id, item.quantity, item.price]
        );

        // Update stock
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      await db.query('COMMIT');

      // Clear related caches
      await redis.del('orders:*');

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    // Clear related caches
    await redis.del('orders:*');

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists and belongs to user (or user is admin)
    let query = 'SELECT * FROM orders WHERE id = $1';
    const queryParams = [id];

    if (req.user.role !== 'admin') {
      query += ' AND user_id = $2';
      queryParams.push(req.user.id);
    }

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update order status
      await db.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', id]
      );

      // Restore stock for cancelled items
      const itemsResult = await db.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      await db.query('COMMIT');

      // Clear related caches
      await redis.del('orders:*');

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

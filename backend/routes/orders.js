const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
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

    // Build MongoDB query
    let query = {};
    
    // Regular users can only see their own orders
    if (req.user.role !== 'admin') {
      query.user_id = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    // Get orders with pagination and populate user data
    const orders = await Order.find(query)
      .populate('user_id', 'username email first_name last_name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(offset);

    // Get total count
    const total = await Order.countDocuments(query);

    const response = {
      orders: orders,
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

    // Build MongoDB query
    let query = { _id: id };
    
    // Regular users can only see their own orders
    if (req.user.role !== 'admin') {
      query.user_id = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('user_id', 'username email first_name last_name')
      .populate('order_items.product_id', 'name image_url');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

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

    // Start MongoDB session for transaction
    const session = await Order.startSession();
    let order;
    
    try {
      order = await session.withTransaction(async () => {
        let totalAmount = 0;
        const orderItems = [];

        // Validate products and calculate total
        for (const item of items) {
          const product = await Product.findById(item.product_id);
          
          if (!product) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}`);
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
        const newOrder = new Order({
          user_id: req.user._id,
          total_amount: totalAmount,
          shipping_address,
          order_items: orderItems
        });

        await newOrder.save({ session });

        // Update stock for each product
        for (const item of orderItems) {
          await Product.findByIdAndUpdate(
            item.product_id,
            { $inc: { stock_quantity: -item.quantity } },
            { session }
          );
        }

        return newOrder;
      });

      // Clear related caches
      await redis.del('orders:*');

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
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

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

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

    // Build MongoDB query
    let query = { _id: id };
    
    // Regular users can only cancel their own orders
    if (req.user.role !== 'admin') {
      query.user_id = req.user._id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order' });
    }

    // Start MongoDB session for transaction
    const session = await Order.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update order status
        await Order.findByIdAndUpdate(
          id,
          { status: 'cancelled' },
          { session }
        );

        // Restore stock for cancelled items
        for (const item of order.order_items) {
          await Product.findByIdAndUpdate(
            item.product_id,
            { $inc: { stock_quantity: item.quantity } },
            { session }
          );
        }
      });

      // Clear related caches
      await redis.del('orders:*');

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

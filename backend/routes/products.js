const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const redis = require('../config/redis');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Try to get from Redis cache first
    const cacheKey = `products:${page}:${limit}:${category || 'all'}:${search || 'none'}:${sortBy}:${sortOrder}`;
    const cachedProducts = await redis.get(cacheKey);

    if (cachedProducts) {
      return res.json({
        success: true,
        data: JSON.parse(cachedProducts)
      });
    }

    // Build MongoDB query
    let query = {};
    
    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    const response = {
      products,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    };

    // Cache the result for 5 minutes
    await redis.setEx(cacheKey, 300, JSON.stringify(response));

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    // Try to get from Redis cache first
    const cachedCategories = await redis.get('product_categories');

    if (cachedCategories) {
      return res.json({
        success: true,
        data: JSON.parse(cachedCategories)
      });
    }

    const categories = await Product.distinct('category', { category: { $ne: null } });

    // Cache for 1 hour
    await redis.setEx('product_categories', 3600, JSON.stringify(categories));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to get from Redis cache first
    const cachedProduct = await redis.get(`product:${id}`);

    if (cachedProduct) {
      return res.json({
        success: true,
        data: JSON.parse(cachedProduct)
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Cache the product for 10 minutes
    await redis.setEx(`product:${id}`, 600, JSON.stringify(product));

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, category, stock_quantity, image_url } = req.body;

    const product = new Product({
      name,
      description,
      price,
      category,
      stock_quantity: stock_quantity || 0,
      image_url
    });

    await product.save();

    // Clear related caches
    await redis.del('products:*');

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, price, category, stock_quantity, image_url } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (image_url !== undefined) updateData.image_url = image_url;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Clear related caches
    await redis.del(`product:${id}`);
    await redis.del('products:*');

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Clear related caches
    await redis.del(`product:${id}`);
    await redis.del('products:*');

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

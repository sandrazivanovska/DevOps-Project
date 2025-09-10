const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const redis = require('../config/redis');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    // Try to get from Redis cache first
    const cacheKey = `products:${page}:${limit}:${category || 'all'}:${search || 'none'}`;
    const cachedProducts = await redis.get(cacheKey);

    if (cachedProducts) {
      return res.json({
        success: true,
        data: JSON.parse(cachedProducts)
      });
    }

    let query = 'SELECT * FROM products WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      queryParams.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), offset);

    const result = await db.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countParams.push(category);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const response = {
      products: result.rows,
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

    const result = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');

    const categories = result.rows.map(row => row.category);

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

    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];

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

    const result = await db.query(
      'INSERT INTO products (name, description, price, category, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, category, stock_quantity || 0, image_url]
    );

    const product = result.rows[0];

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

    // Check if product exists
    const existingProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const result = await db.query(
      'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), category = COALESCE($4, category), stock_quantity = COALESCE($5, stock_quantity), image_url = COALESCE($6, image_url), updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, category, stock_quantity, image_url, id]
    );

    const product = result.rows[0];

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

    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
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

const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const redis = require('../config/redis');
const { protect } = require('../middleware/auth');

const router = express.Router();


router.get('/', protect, async (req, res) => {
  try {
    const cacheKey = `cart:${req.user._id}`;
    const cachedCart = await redis.get(cacheKey);

    if (cachedCart) {
      return res.json({
        success: true,
        data: JSON.parse(cachedCart)
      });
    }

    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price image_url category')
      .lean();

    if (!cart) {
      cart = {
        user: req.user._id,
        items: [],
        total: 0
      };
    }

    await redis.setEx(cacheKey, 300, JSON.stringify(cart));

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/items', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock_quantity} items available in stock` 
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name price image_url category');

    await redis.del(`cart:${req.user._id}`);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/items/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock_quantity} items available in stock` 
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'name price image_url category');

    await redis.del(`cart:${req.user._id}`);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/items/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product', 'name price image_url category');

    await redis.del(`cart:${req.user._id}`);

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    await redis.del(`cart:${req.user._id}`);

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

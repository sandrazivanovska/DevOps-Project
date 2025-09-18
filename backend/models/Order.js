const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shipping_address: {
    type: String,
    required: true,
    trim: true
  },
  order_items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Index for better performance
orderSchema.index({ user_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ created_at: -1 });

// Virtual for order total calculation
orderSchema.virtual('calculatedTotal').get(function() {
  return this.order_items.reduce((total, item) => total + (item.quantity * item.price), 0);
});

// Method to add item to order
orderSchema.methods.addItem = function(productId, quantity, price) {
  const existingItem = this.order_items.find(item => item.product_id.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.order_items.push({
      product_id: productId,
      quantity: quantity,
      price: price
    });
  }
  
  this.total_amount = this.calculatedTotal;
  return this.save();
};

// Method to remove item from order
orderSchema.methods.removeItem = function(productId) {
  this.order_items = this.order_items.filter(item => item.product_id.toString() !== productId.toString());
  this.total_amount = this.calculatedTotal;
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);



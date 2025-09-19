const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 999999.99
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  stock_quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  image_url: {
    type: String,
    trim: true,
    maxlength: 255
  }
}, {
  timestamps: true
});

productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' }); 

productSchema.virtual('isAvailable').get(function() {
  return this.stock_quantity > 0;
});

module.exports = mongoose.model('Product', productSchema);






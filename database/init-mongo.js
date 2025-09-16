// MongoDB initialization script for DevOps Project App
// This script creates the database and inserts sample data

// Switch to the application database
db = db.getSiblingDB('devops_app');

// Create a user for the application
db.createUser({
  user: 'devops_user',
  pwd: 'devops_password',
  roles: [
    {
      role: 'readWrite',
      db: 'devops_app'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password_hash'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 50
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password_hash: {
          bsonType: 'string',
          minLength: 6
        },
        first_name: {
          bsonType: 'string',
          maxLength: 50
        },
        last_name: {
          bsonType: 'string',
          maxLength: 50
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin']
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price', 'category'],
      properties: {
        name: {
          bsonType: 'string',
          maxLength: 100
        },
        description: {
          bsonType: 'string'
        },
        price: {
          bsonType: 'number',
          minimum: 0,
          maximum: 999999.99
        },
        category: {
          bsonType: 'string',
          maxLength: 50
        },
        stock_quantity: {
          bsonType: 'number',
          minimum: 0
        },
        image_url: {
          bsonType: 'string',
          maxLength: 255
        }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'total_amount', 'shipping_address', 'order_items'],
      properties: {
        user_id: {
          bsonType: 'objectId'
        },
        total_amount: {
          bsonType: 'number',
          minimum: 0
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        },
        shipping_address: {
          bsonType: 'string'
        },
        order_items: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['product_id', 'quantity', 'price'],
            properties: {
              product_id: {
                bsonType: 'objectId'
              },
              quantity: {
                bsonType: 'number',
                minimum: 1
              },
              price: {
                bsonType: 'number',
                minimum: 0
              }
            }
          }
        }
      }
    }
  }
});

db.createCollection('auditlogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['table_name', 'record_id', 'action'],
      properties: {
        table_name: {
          bsonType: 'string',
          maxLength: 50
        },
        record_id: {
          bsonType: 'objectId'
        },
        action: {
          bsonType: 'string',
          enum: ['create', 'update', 'delete', 'read']
        },
        old_values: {
          bsonType: 'object'
        },
        new_values: {
          bsonType: 'object'
        },
        user_id: {
          bsonType: 'objectId'
        },
        ip_address: {
          bsonType: 'string'
        },
        user_agent: {
          bsonType: 'string'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

db.products.createIndex({ category: 1 });
db.products.createIndex({ name: 'text', description: 'text' });

db.orders.createIndex({ user_id: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

db.auditlogs.createIndex({ table_name: 1, record_id: 1 });
db.auditlogs.createIndex({ user_id: 1 });
db.auditlogs.createIndex({ createdAt: -1 });
db.auditlogs.createIndex({ action: 1 });

// Insert sample users
db.users.insertMany([
  {
    username: 'admin',
    email: 'admin@devops-app.com',
    password_hash: '$2b$10$rQZ8kF9XvJ2mN3pL5qR7Te8W1xY4zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vX9yZ',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: 'john_doe',
    email: 'john@example.com',
    password_hash: '$2b$10$rQZ8kF9XvJ2mN3pL5qR7Te8W1xY4zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vX9yZ',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    username: 'jane_smith',
    email: 'jane@example.com',
    password_hash: '$2b$10$rQZ8kF9XvJ2mN3pL5qR7Te8W1xY4zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vX9yZ',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample products
db.products.insertMany([
  {
    name: 'Laptop Pro 15"',
    description: 'High-performance laptop with 16GB RAM and 512GB SSD',
    price: 1299.99,
    category: 'Electronics',
    stock_quantity: 25,
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: 29.99,
    category: 'Electronics',
    stock_quantity: 100,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with blue switches',
    price: 89.99,
    category: 'Electronics',
    stock_quantity: 50,
    image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Office Chair',
    description: 'Comfortable ergonomic office chair with lumbar support',
    price: 199.99,
    category: 'Furniture',
    stock_quantity: 30,
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness and color temperature',
    price: 45.99,
    category: 'Furniture',
    stock_quantity: 75,
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Coffee Mug',
    description: 'Ceramic coffee mug with company logo',
    price: 12.99,
    category: 'Accessories',
    stock_quantity: 200,
    image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('MongoDB initialization completed successfully!');
print('Database: devops_app');
print('Collections created: users, products, orders, auditlogs');
print('Sample data inserted successfully!');

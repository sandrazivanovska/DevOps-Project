-- Database initialization script for DevOps Project App
-- This script creates the database schema and inserts sample data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@devops-app.com', '$2b$10$rQZ8kF9XvJ2mN3pL5qR7Te8W1xY4zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vX9yZ', 'Admin', 'User', 'admin'),
('john_doe', 'john@example.com', '$2b$10$rQZ8kF9XvJ2mN3pL5qR7Te8W1xY4zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vX9yZ', 'John', 'Doe', 'user'),
('jane_smith', 'jane@example.com', '$2b$10$rQZ8kF9XvJ2mN3pL5qR7Te8W1xY4zA6bC9dE2fG5hI8jK1lM4nO7pQ0rS3tU6vX9yZ', 'Jane', 'Smith', 'user');

-- Insert sample products
INSERT INTO products (name, description, price, category, stock_quantity, image_url) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'Electronics', 25, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'Electronics', 100, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches', 89.99, 'Electronics', 50, 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400'),
('Office Chair', 'Comfortable ergonomic office chair with lumbar support', 199.99, 'Furniture', 30, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'),
('Desk Lamp', 'LED desk lamp with adjustable brightness and color temperature', 45.99, 'Furniture', 75, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Coffee Mug', 'Ceramic coffee mug with company logo', 12.99, 'Accessories', 200, 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400');

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
(2, 1329.98, 'completed', '123 Main St, City, State 12345'),
(3, 89.99, 'pending', '456 Oak Ave, City, State 67890'),
(2, 245.98, 'shipped', '123 Main St, City, State 12345');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 1299.99),
(1, 2, 1, 29.99),
(2, 3, 1, 89.99),
(3, 4, 1, 199.99),
(3, 5, 1, 45.99);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

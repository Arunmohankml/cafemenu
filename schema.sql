-- =============================================
-- AURA CAFE - Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MENU ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_veg BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  quantity_available INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS cafe_tables (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  capacity INT DEFAULT 4,
  qr_code_url TEXT
);

-- Insert default tables
INSERT INTO cafe_tables (id, name, capacity) VALUES
  (1, 'Table 1', 2), (2, 'Table 2', 4), (3, 'Table 3', 4),
  (4, 'Table 4', 6), (5, 'Table 5', 2), (6, 'Table 6', 4),
  (7, 'Table 7', 4), (8, 'Table 8', 8), (9, 'Table 9', 2),
  (10, 'Table 10', 4)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_id INT REFERENCES cafe_tables(id),
  customer_session TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'pay_at_reception' CHECK (payment_method IN ('online', 'pay_at_reception')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  notes TEXT,
  is_editable BOOLEAN DEFAULT TRUE,
  edit_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECEIPTS
-- =============================================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: everyone can read
DROP POLICY IF EXISTS "Categories are public" ON categories;
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff/Admin can manage categories" ON categories;
CREATE POLICY "Staff/Admin can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- Menu Items: everyone can read
DROP POLICY IF EXISTS "Menu items are public" ON menu_items;
CREATE POLICY "Menu items are public" ON menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff/Admin can manage menu" ON menu_items;
CREATE POLICY "Staff/Admin can manage menu" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- Tables: everyone can read
DROP POLICY IF EXISTS "Tables are public" ON cafe_tables;
CREATE POLICY "Tables are public" ON cafe_tables FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff/Admin can manage tables" ON cafe_tables;
CREATE POLICY "Staff/Admin can manage tables" ON cafe_tables FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- Orders: customers can insert and read their session orders, staff/admin can read all
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view orders by session" ON orders;
CREATE POLICY "Anyone can view orders by session" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true);

-- Order items: open for now (in production, restrict by session)
DROP POLICY IF EXISTS "Anyone can manage order items" ON order_items;
CREATE POLICY "Anyone can manage order items" ON order_items FOR ALL USING (true);

-- Receipts: everyone can read
DROP POLICY IF EXISTS "Receipts are viewable" ON receipts;
CREATE POLICY "Receipts are viewable" ON receipts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff/Admin can manage receipts" ON receipts;
CREATE POLICY "Staff/Admin can manage receipts" ON receipts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
);

-- =============================================
-- SEED DATA - Categories
-- =============================================
INSERT INTO categories (name, icon, sort_order) VALUES
  ('Coffee', '☕', 1),
  ('Tea', '🍵', 2),
  ('Desserts', '🍰', 3),
  ('Snacks', '🥪', 4),
  ('Meals', '🍽️', 5),
  ('Beverages', '🥤', 6)
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED DATA - Menu Items
-- =============================================
INSERT INTO menu_items (name, description, price, image_url, is_available, is_veg, is_featured, category_id) VALUES
  ('Aura Signature Espresso', 'Double shot pulled from single-origin Ethiopian beans with notes of jasmine and dark chocolate.', 4.50, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0fd24?w=600&q=80', true, true, true, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1)),
  ('Nebula Latte', 'Smooth flat white with oat milk, infused with subtle vanilla bean and topped with silver leaf.', 6.50, 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80', true, true, true, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1)),
  ('Quantum Matcha', 'Ceremonial grade matcha whisked to perfection with a touch of agave nectar.', 7.00, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=80', true, true, true, (SELECT id FROM categories WHERE name = 'Tea' LIMIT 1)),
  ('Void Chocolate Tart', 'Decadent dark chocolate ganache in a charcoal pastry shell, sprinkled with Himalayan sea salt.', 8.50, 'https://images.unsplash.com/photo-1511381939415-e440c9c368d4?w=600&q=80', true, true, false, (SELECT id FROM categories WHERE name = 'Desserts' LIMIT 1)),
  ('Truffle Edamame', 'Warm edamame tossed in white truffle oil and smoked salt. A perfect bar snack.', 5.50, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', true, true, false, (SELECT id FROM categories WHERE name = 'Snacks' LIMIT 1)),
  ('Cold Brew Noir', '18-hour cold brewed single-origin coffee served over obsidian ice. Smooth and powerful.', 7.50, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', true, true, true, (SELECT id FROM categories WHERE name = 'Coffee' LIMIT 1)),
  ('Yuzu Lemonade', 'Japanese yuzu citrus blended with spring water and a hint of white mint. Refreshingly elegant.', 5.00, 'https://images.unsplash.com/photo-1587016819369-ef8124fb44f0?w=600&q=80', true, true, false, (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1)),
  ('Truffle Avocado Toast', 'Sourdough toast with whipped ricotta, avocado, microgreens and black truffle shavings.', 14.00, 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80', true, true, true, (SELECT id FROM categories WHERE name = 'Meals' LIMIT 1))
ON CONFLICT DO NOTHING;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- =============================================
-- Enable Realtime on orders and order_items
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE cafe_tables;

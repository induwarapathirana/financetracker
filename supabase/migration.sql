-- ============================================================
-- Sweet Delights Finance Tracker — Supabase Migration
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. Raw Materials / Ingredients
CREATE TABLE raw_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Catalog Items (Products)
CREATE TABLE catalog_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Cakes',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Recipes — links catalog items to raw materials
CREATE TABLE item_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES catalog_items(id) ON DELETE CASCADE,
  material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
  UNIQUE(item_id, material_id)
);

-- 4. Per-item complexity/creativity multiplier tiers
CREATE TABLE item_multipliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES catalog_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('complexity', 'creativity')),
  label TEXT NOT NULL,
  multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  sort_order INT DEFAULT 0
);

-- 5. Per-item add-ons
CREATE TABLE item_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES catalog_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  addon_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  addon_price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 6. Invoices
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  delivery_date DATE,
  notes TEXT DEFAULT '',
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_profit NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Invoice line items
CREATE TABLE invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT '',
  quantity INT NOT NULL DEFAULT 1,
  complexity_label TEXT DEFAULT 'Standard',
  creativity_label TEXT DEFAULT 'Standard',
  addons_json JSONB DEFAULT '[]',
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- 8. Expenses
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Ingredients',
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security — Allow all for anon (public app for now)
-- ============================================================
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anon role (single user app)
CREATE POLICY "Allow all" ON raw_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON catalog_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON item_recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON item_multipliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON item_addons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON invoice_line_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true) WITH CHECK (true);

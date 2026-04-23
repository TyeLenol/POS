BEGIN;

INSERT INTO users (username, password_hash, role, is_active)
VALUES ('admin', '', 'manager', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (sku, name, category, price, stock, barcode, cost)
VALUES
  ('BEV-APL-001', 'Apple Juice 1L', 'Beverages', 18.50, 42, NULL, 10.00),
  ('PAN-COF-004', 'Roast Coffee Beans 500g', 'Pantry', 46.00, 28, NULL, 30.00),
  ('BAK-BRD-017', 'Fresh Bread Loaf', 'Bakery', 9.50, 65, NULL, 5.00),
  ('STA-RIC-110', 'Premium Rice 5kg', 'Staples', 120.00, 18, NULL, 80.00),
  ('HOU-DET-203', 'Laundry Detergent 2L', 'Household', 38.00, 30, NULL, 24.00),
  ('SNK-MIX-087', 'Mixed Snack Pack', 'Snacks', 24.00, 56, NULL, 14.00),
  ('DAR-MLK-009', 'Whole Milk 1L', 'Dairy', 12.00, 40, NULL, 7.50),
  ('PER-TOL-311', 'Toiletries Bundle', 'Personal Care', 55.00, 22, NULL, 32.00),
  ('BEV-WAT-016', 'Water Case 12x', 'Beverages', 60.00, 12, NULL, 45.00)
ON CONFLICT (sku) DO NOTHING;

COMMIT;

import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import { pool } from './db.js'

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

// Middleware to extract and validate JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Middleware to require manager role
const managerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'manager') {
    return res.status(403).json({ message: 'This action requires manager role' })
  }
  next()
}

const normalizePhone = (phone) => String(phone ?? '').replace(/\D/g, '')
const trimOrNull = (value) => {
  const trimmed = String(value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

// Auth endpoint: login with username and password
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' })
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, role, is_active FROM users WHERE username = $1',
      [username],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const user = result.rows[0]

    if (!user.is_active) {
      return res.status(401).json({ message: 'User account is inactive' })
    }

    // If password_hash is empty (default admin user), set it on first login
    if (!user.password_hash || user.password_hash === '') {
      const hashedPassword = await bcrypt.hash(password, 10)
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
        hashedPassword,
        user.id,
      ])
      user.password_hash = hashedPassword
    }

    // Compare provided password with stored hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' },
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Auth endpoint: owner/admin sign-up
app.post('/api/auth/signup', async (req, res) => {
  const { username, password, firstName, lastName, phone, email, country } = req.body || {}

  if (!username || !password || !firstName || !lastName || !phone || !country) {
    return res.status(400).json({
      message: 'Username, password, first name, last name, phone, and country are required',
    })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const existing = await pool.query('SELECT id, password_hash FROM users WHERE username = $1', [
      username,
    ])

    if (existing.rows.length > 0) {
      const user = existing.rows[0]
      if (!user.password_hash) {
        const updated = await pool.query(
          `UPDATE users
           SET password_hash = $1, role = 'manager', first_name = $2, last_name = $3,
               phone = $4, email = $5, country = $6, is_active = true
           WHERE id = $7
           RETURNING id, username, role`,
          [hashedPassword, firstName, lastName, phone, email || null, country, user.id],
        )
        return res.status(201).json(updated.rows[0])
      }
      return res.status(409).json({ message: 'Username already exists' })
    }

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, is_active, first_name, last_name, phone, email, country)
       VALUES ($1, $2, 'manager', true, $3, $4, $5, $6, $7)
       RETURNING id, username, role`,
      [username, hashedPassword, firstName, lastName, phone, email || null, country],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'Username already exists' })
    } else {
      res.status(500).json({ message: error.message })
    }
  }
})

// Auth endpoint: create new user (manager only)
app.post('/api/auth/users', authMiddleware, managerOnly, async (req, res) => {
  const { username, password, role } = req.body || {}

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role required' })
  }

  if (!['cashier', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Role must be "cashier" or "manager"' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, is_active) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [username, hashedPassword, role, true],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'Username already exists' })
    } else {
      res.status(500).json({ message: error.message })
    }
  }
})

// Onboarding status (manager only)
app.get('/api/onboarding/status', authMiddleware, managerOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT onboarding_completed FROM business_profile WHERE id = 1',
    )
    const status = result.rows[0] || { onboarding_completed: false }
    res.json({ onboardingCompleted: Boolean(status.onboarding_completed) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Onboarding profile (manager only)
app.get('/api/onboarding/profile', authMiddleware, managerOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM business_profile WHERE id = 1')
    res.json(result.rows[0] || null)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Complete onboarding (manager only)
app.post('/api/onboarding/complete', authMiddleware, managerOnly, async (req, res) => {
  const { storeName, address, phone, email, currency, taxRate } = req.body || {}

  if (!storeName || !phone) {
    return res.status(400).json({ message: 'Store name and phone are required.' })
  }

  try {
    await pool.query(
      `UPDATE business_profile
       SET store_name = $1,
           address = $2,
           phone = $3,
           email = $4,
           currency = $5,
           tax_rate = $6,
           onboarding_completed = true,
           updated_at = now()
       WHERE id = 1`,
      [storeName, address || null, phone, email || null, currency || 'GHS', taxRate || 0],
    )

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})
const mapReceipts = (rows) => {
  const receiptMap = new Map()

  rows.forEach((row) => {
    const id = row.receipt_id
    if (!receiptMap.has(id)) {
      receiptMap.set(id, {
        id,
        number: row.receipt_number,
        createdAt: row.issued_at,
        items: [],
        subtotal: Number(row.subtotal || 0),
        tax: Number(row.tax || 0),
        total: Number(row.order_total || row.receipt_total || 0),
        paymentMethod: (row.payment_method || 'cash').toLowerCase(),
        status: row.receipt_status || 'paid',
        customer: {
          name: row.customer_name || '',
          phone: row.customer_phone || '',
          note: '',
        },
      })
    }

    if (row.item_id) {
      receiptMap.get(id).items.push({
        product: {
          id: row.product_id || row.item_id,
          name: row.item_name,
          category: row.product_category || 'General',
          sku: row.item_sku,
          price: Number(row.unit_price || 0),
          stock: Number(row.product_stock || 0),
        },
        quantity: Number(row.quantity || 0),
      })
    }
  })

  return Array.from(receiptMap.values())
}

const receiptsQuery = `
  SELECT
    r.id AS receipt_id,
    r.receipt_number,
    r.issued_at,
    r.total AS receipt_total,
    r.status AS receipt_status,
    o.subtotal,
    o.tax,
    o.total AS order_total,
    c.name AS customer_name,
    c.phone AS customer_phone,
    pay.method AS payment_method,
    oi.id AS item_id,
    oi.sku AS item_sku,
    oi.name AS item_name,
    oi.unit_price,
    oi.quantity,
    pr.id AS product_id,
    pr.category AS product_category,
    pr.stock AS product_stock
  FROM receipts r
  JOIN orders o ON o.id = r.order_id
  LEFT JOIN customers c ON c.id = o.customer_id
  LEFT JOIN LATERAL (
    SELECT method FROM payments WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1
  ) pay ON true
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN products pr ON pr.id = oi.product_id
`

const getReceipts = async (orderId) => {
  const clause = orderId ? 'WHERE r.order_id = $1' : ''
  const orderBy = 'ORDER BY r.issued_at DESC, oi.id'
  const query = `${receiptsQuery} ${clause} ${orderBy}`
  const params = orderId ? [orderId] : []
  const result = await pool.query(query, params)
  return mapReceipts(result.rows)
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, sku, name, category, price, stock, barcode, cost
       FROM products
       WHERE is_active = true
       ORDER BY category, name`,
    )
    res.json(
      result.rows.map((row) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        stock: Number(row.stock),
        barcode: row.barcode,
        cost: row.cost ? Number(row.cost) : null,
      })),
    )
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create a new product (cashier and manager)
app.post('/api/products', authMiddleware, async (req, res) => {
  const { sku, name, category, price, stock, barcode, cost } = req.body || {}

  if (!sku || !name || !category || !price) {
    return res.status(400).json({ message: 'SKU, name, category, and price are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (id, sku, name, category, price, stock, barcode, cost, is_active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, sku, name, category, price, stock, barcode, cost`,
      [
        sku,
        name,
        category,
        price,
        stock ? Number(stock) : 0,
        barcode || null,
        cost ? Number(cost) : null,
      ],
    )

    res.status(201).json({
      ...result.rows[0],
      price: Number(result.rows[0].price),
      stock: Number(result.rows[0].stock),
      cost: result.rows[0].cost ? Number(result.rows[0].cost) : null,
    })
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'SKU or barcode already exists' })
    } else {
      res.status(500).json({ message: error.message })
    }
  }
})

app.put('/api/products/:id', authMiddleware, managerOnly, async (req, res) => {
  const { id } = req.params
  const { sku, name, category, price, stock, barcode, cost } = req.body || {}

  if (!sku || !name || !category || price === undefined) {
    return res.status(400).json({ message: 'SKU, name, category, and price are required' })
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET sku = $1, name = $2, category = $3, price = $4, stock = $5,
           barcode = $6, cost = $7, updated_at = now()
       WHERE id = $8 AND is_active = true
       RETURNING id, sku, name, category, price, stock, barcode, cost`,
      [
        sku,
        name,
        category,
        price,
        stock != null ? Number(stock) : 0,
        barcode || null,
        cost ? Number(cost) : null,
        id,
      ],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const row = result.rows[0]
    res.json({
      ...row,
      price: Number(row.price),
      stock: Number(row.stock),
      cost: row.cost ? Number(row.cost) : null,
    })
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'SKU or barcode already exists' })
    } else {
      res.status(500).json({ message: error.message })
    }
  }
})

app.delete('/api/products/:id', authMiddleware, managerOnly, async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      'UPDATE products SET is_active = false, updated_at = now() WHERE id = $1 AND is_active = true RETURNING id',
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/customers', authMiddleware, async (req, res) => {
  const { q } = req.query

  try {
    let result
    if (q) {
      result = await pool.query(
        `SELECT id, name, phone, email, created_at
         FROM customers
         WHERE phone ILIKE $1 OR name ILIKE $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [`%${q}%`],
      )
    } else {
      result = await pool.query(
        `SELECT id, name, phone, email, created_at FROM customers ORDER BY created_at DESC LIMIT 50`,
      )
    }
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/customers', authMiddleware, async (req, res) => {
  const { name, phone, email } = req.body || {}
  const customerName = trimOrNull(name)
  const customerPhone = trimOrNull(phone)
  const customerEmail = trimOrNull(email)

  if (!customerName || !customerPhone) {
    return res.status(400).json({ message: 'Name and phone are required' })
  }

  const normalizedPhone = normalizePhone(customerPhone)

  if (!normalizedPhone) {
    return res.status(400).json({ message: 'Phone number is required' })
  }

  try {
    const existingResult = await pool.query(
      `SELECT id, name, phone, email, created_at
       FROM customers
       WHERE regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedPhone],
    )

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0]
      const result = await pool.query(
        `UPDATE customers
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             email = COALESCE($3, email)
         WHERE id = $4
         RETURNING id, name, phone, email, created_at`,
        [customerName, customerPhone, customerEmail, existing.id],
      )
      res.status(200).json(result.rows[0])
      return
    }

    const result = await pool.query(
      `INSERT INTO customers (name, phone, email)
       VALUES ($1, $2, $3)
       RETURNING id, name, phone, email, created_at`,
      [customerName, customerPhone, customerEmail],
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.put('/api/settings', authMiddleware, managerOnly, async (req, res) => {
  const { storeName, address, phone, email, currency, taxRate } = req.body || {}
  try {
    await pool.query(
      `UPDATE business_profile
       SET store_name = $1, address = $2, phone = $3, email = $4,
           currency = $5, tax_rate = $6, updated_at = now()
       WHERE id = 1`,
      [
        storeName || null,
        address || null,
        phone || null,
        email || null,
        currency || 'GHS',
        taxRate ?? 0,
      ],
    )
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/staff', authMiddleware, managerOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, role, is_active, first_name, last_name, email, phone, created_at
       FROM users
       ORDER BY role DESC, created_at ASC`,
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.put('/api/staff/:id', authMiddleware, managerOnly, async (req, res) => {
  const { id } = req.params
  const { is_active, first_name, last_name, email, role } = req.body || {}

  if (String(req.user.id) === String(id)) {
    return res.status(400).json({ message: 'Cannot modify your own account' })
  }

  if (role !== undefined && !['cashier', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Role must be "cashier" or "manager"' })
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET is_active  = COALESCE($1, is_active),
           first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name),
           email      = COALESCE($4, email),
           role       = COALESCE($5, role)
       WHERE id = $6
       RETURNING id, username, role, is_active, first_name, last_name, email`,
      [
        is_active !== undefined ? Boolean(is_active) : null,
        first_name || null,
        last_name || null,
        email || null,
        role || null,
        id,
      ],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.delete('/api/staff/:id', authMiddleware, managerOnly, async (req, res) => {
  const { id } = req.params

  if (String(req.user.id) === String(id)) {
    return res.status(400).json({ message: 'Cannot delete your own account' })
  }

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' })
    }
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/reports/summary', authMiddleware, managerOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT o.id)::int AS order_count,
        COALESCE(SUM(o.total), 0)::numeric AS total_revenue,
        COALESCE(AVG(o.total), 0)::numeric AS avg_order,
        COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE THEN o.id END)::int AS today_orders,
        COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE THEN o.total ELSE 0 END), 0)::numeric AS today_revenue,
        COUNT(DISTINCT CASE WHEN o.created_at >= date_trunc('week', CURRENT_DATE) THEN o.id END)::int AS week_orders,
        COALESCE(SUM(CASE WHEN o.created_at >= date_trunc('week', CURRENT_DATE) THEN o.total ELSE 0 END), 0)::numeric AS week_revenue
      FROM orders o
      WHERE o.status = 'paid'
    `)
    const row = result.rows[0]
    res.json({
      orderCount: row.order_count,
      totalRevenue: Number(row.total_revenue),
      avgOrder: Number(row.avg_order),
      todayOrders: row.today_orders,
      todayRevenue: Number(row.today_revenue),
      weekOrders: row.week_orders,
      weekRevenue: Number(row.week_revenue),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/reports/products', authMiddleware, managerOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        oi.name,
        SUM(oi.quantity)::int AS total_qty,
        COALESCE(SUM(oi.line_total), 0)::numeric AS total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status = 'paid'
      GROUP BY oi.name
      ORDER BY total_qty DESC
      LIMIT 10
    `)
    res.json(
      result.rows.map((row) => ({
        name: row.name,
        totalQty: row.total_qty,
        totalRevenue: Number(row.total_revenue),
      })),
    )
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/reports/inventory', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, sku, name, category, price, stock, barcode, cost
      FROM products
      WHERE is_active = true
      ORDER BY stock ASC, name
    `)
    res.json(
      result.rows.map((row) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        stock: Number(row.stock),
        barcode: row.barcode,
        cost: row.cost ? Number(row.cost) : null,
      })),
    )
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/receipts', authMiddleware, async (req, res) => {
  try {
    const receipts = await getReceipts()
    res.json(receipts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/orders', authMiddleware, async (req, res) => {
  const { customer, items, totals, payment } = req.body || {}

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'Order must include items.' })
    return
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let customerId = null
    if (customer && (customer.name || customer.phone || customer.email)) {
      if (customer.phone) {
        const normalizedPhone = normalizePhone(customer.phone)

        if (normalizedPhone) {
          const existingCustomer = await client.query(
            `SELECT id, name, phone, email
             FROM customers
             WHERE regexp_replace(COALESCE(phone, ''), '\\D', '', 'g') = $1
             ORDER BY created_at DESC
             LIMIT 1
             FOR UPDATE`,
            [normalizedPhone],
          )

          if (existingCustomer.rows.length > 0) {
            const customerRow = existingCustomer.rows[0]
            await client.query(
              `UPDATE customers
               SET name = COALESCE($1, name),
                   email = COALESCE($2, email)
               WHERE id = $3`,
              [trimOrNull(customer.name), trimOrNull(customer.email), customerRow.id],
            )
            customerId = customerRow.id
          } else {
            const customerResult = await client.query(
              `INSERT INTO customers (name, phone, email)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [trimOrNull(customer.name), trimOrNull(customer.phone), trimOrNull(customer.email)],
            )
            customerId = customerResult.rows[0].id
          }
        }
      } else {
        const customerResult = await client.query(
          `INSERT INTO customers (name, phone, email)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [trimOrNull(customer.name), null, trimOrNull(customer.email)],
        )
        customerId = customerResult.rows[0].id
      }
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const orderNumber = `POS-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, customer_id, status, subtotal, tax, total, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        orderNumber,
        customerId,
        payment?.status === 'success' ? 'paid' : 'open',
        totals?.subtotal || 0,
        totals?.tax || 0,
        totals?.total || 0,
        totals?.currency || 'GHS',
      ],
    )

    const orderId = orderResult.rows[0].id

    for (const item of items) {
      const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 0)
      await client.query(
        `INSERT INTO order_items (order_id, product_id, sku, name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.productId || null,
          item.sku,
          item.name,
          item.unitPrice || 0,
          item.quantity || 0,
          lineTotal,
        ],
      )
      if (item.productId) {
        await client.query(
          'UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = now() WHERE id = $2',
          [item.quantity || 0, item.productId],
        )
      }
    }

    await client.query(
      `INSERT INTO payments (order_id, method, status, reference, amount, currency, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        orderId,
        payment?.method || 'cash',
        payment?.status || 'pending',
        payment?.reference || null,
        payment?.amount || totals?.total || 0,
        totals?.currency || 'GHS',
        payment?.provider || null,
      ],
    )

    const receiptNumber = `RC-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`
    await client.query(
      `INSERT INTO receipts (order_id, receipt_number, total, status)
       VALUES ($1, $2, $3, $4)`,
      [
        orderId,
        receiptNumber,
        totals?.total || 0,
        payment?.status === 'success' ? 'paid' : 'failed',
      ],
    )

    await client.query('COMMIT')

    const receiptResult = await client.query(
      `${receiptsQuery} WHERE r.order_id = $1 ORDER BY r.issued_at DESC, oi.id`,
      [orderId],
    )
    const receipts = mapReceipts(receiptResult.rows)
    res.status(201).json(receipts[0])
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ message: error.message })
  } finally {
    client.release()
  }
})

const port = Number(process.env.PORT || 4000)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`POS API listening on http://localhost:${port}`))
}

export default app
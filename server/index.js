import express from 'express'

import { pool } from './db.js'

const app = express()

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
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

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, sku, name, category, price, stock
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
      })),
    )
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/receipts', async (req, res) => {
  try {
    const receipts = await getReceipts()
    res.json(receipts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/orders', async (req, res) => {
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
      const customerResult = await client.query(
        `INSERT INTO customers (name, phone, email)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [customer.name || null, customer.phone || null, customer.email || null],
      )
      customerId = customerResult.rows[0].id
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
app.listen(port, () => {
  console.log(`POS API listening on http://localhost:${port}`)
})

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

// Production: serve frontend build from same origin (one URL for everything)
if (isProd) {
  const distPath = path.join(__dirname, 'dist')
  app.use(express.static(distPath))
}

// Simple file-based DB (hosting pe path env se bhi de sakte ho)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'restaurant.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );
`)

function getOpenOrderId(tableId) {
  const existing = db
    .prepare('SELECT id FROM orders WHERE table_id = ? AND status = "open" ORDER BY id DESC LIMIT 1')
    .get(tableId)
  if (existing) return existing.id
  const info = db
    .prepare('INSERT INTO orders (table_id, status) VALUES (?, "open")')
    .run(tableId)
  return info.lastInsertRowid
}

app.post('/api/order/:tableId/add-items', (req, res) => {
  const tableId = String(req.params.tableId || '').trim() || 'T-1'
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  if (!items.length) return res.status(400).json({ error: 'No items' })

  const orderId = getOpenOrderId(tableId)
  const insert = db.prepare('INSERT INTO order_items (order_id, name, qty, price) VALUES (?, ?, ?, ?)')

  const tx = db.transaction(() => {
    for (const it of items) {
      const qty = Math.max(1, Math.min(999, Number(it.qty || 1)))
      const price = Math.max(0, Math.min(1_000_000, Number(it.price || 0)))
      insert.run(orderId, String(it.name || 'Item'), qty, price)
    }
  })
  tx()

  return res.json({ ok: true, orderId })
})

app.get('/api/order/:tableId', (req, res) => {
  const tableId = String(req.params.tableId || '').trim()
  if (!tableId) return res.status(400).json({ error: 'tableId required' })

  const order = db
    .prepare('SELECT id, status, created_at FROM orders WHERE table_id = ? AND status = "open" ORDER BY id DESC LIMIT 1')
    .get(tableId)
  if (!order) return res.json({ tableId, items: [], total: 0 })

  const rows = db
    .prepare('SELECT id, name, qty, price FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(order.id)
  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    qty: r.qty,
    price: r.price,
    amount: r.qty * r.price,
  }))
  const total = items.reduce((s, it) => s + it.amount, 0)

  res.json({ tableId, orderId: order.id, status: order.status, items, total })
})

app.get('/api/orders/open', (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT o.id, o.table_id, o.created_at,
             COALESCE(SUM(oi.qty * oi.price), 0) AS total
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status = "open"
      GROUP BY o.id, o.table_id, o.created_at
      ORDER BY o.created_at DESC
    `,
    )
    .all()
  res.json(rows)
})

app.post('/api/order/:orderId/close', (req, res) => {
  const orderId = Number(req.params.orderId || 0)
  if (!orderId) return res.status(400).json({ error: 'orderId required' })
  db.prepare('UPDATE orders SET status = "closed" WHERE id = ?').run(orderId)
  res.json({ ok: true })
})

// SPA fallback: hosted pe #waiter / #counter ke liye index.html (Express 5 me * / /* invalid)
if (isProd) {
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}${isProd ? ' (production)' : ''}`)
})


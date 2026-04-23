let handler

try {
  const mod = await import('../server/index.js')
  handler = mod.default
} catch (err) {
  console.error('[api] Failed to load server:', err)
  handler = (_req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.status(500).end(JSON.stringify({ message: 'Server failed to initialize', error: err.message }))
  }
}

export default handler

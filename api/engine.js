// Thin server-side relay to the existing VER-DÉ 2.0 engine (engine.ver-de.com/api/chat).
// The engine is not copied or modified; this only forwards the request so the
// browser avoids cross-origin limits. No API keys live in this project.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const upstream = await fetch('https://engine.ver-de.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err) {
    res.status(502).json({ error: 'Engine unreachable' });
  }
};

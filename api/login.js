// api/login.js  (Node runtime–safe JSON parsing)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // (Optional) CORS preflight if your frontend is on another domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read raw body and parse JSON (Node style)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString() || '{}';
    const { password } = JSON.parse(raw);

    if (!password) return res.status(400).json({ error: 'Password required' });

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Secure cookie (HttpOnly, Secure, SameSite=Strict)
    const cookieName = process.env.COOKIE_NAME || 'vc_admin';
    const cookie = `${cookieName}=1; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=3600`;
    res.setHeader('Set-Cookie', cookie);

    // (Optional) CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}

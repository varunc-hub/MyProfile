// api/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { password } = await req.json?.() || await new Response(req.body).json();
    if (!password) return res.status(400).json({ error: 'Password required' });

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const cookie = `${process.env.COOKIE_NAME}=1; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=3600`;
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}

// api/logout.js
export default function handler(req, res) {
  const cookie = `${process.env.COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`;
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ ok: true });
}

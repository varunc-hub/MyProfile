function isAuthed(req) {
  const cookieName = process.env.COOKIE_NAME || 'vc_admin';
  const cookies = req.headers.cookie || '';
  return cookies.split(';').some(c => c.trim().startsWith(`${cookieName}=`));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Node-style JSON parse
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString() || '{}';
    const { filename, base64, message } = JSON.parse(raw);

    if (!filename || !base64) return res.status(400).json({ error: 'filename and base64 required' });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `assets/${safeName}`;

    const { GITHUB_OWNER: owner, GITHUB_REPO: repo, GITHUB_BRANCH: branch = 'main', GITHUB_TOKEN: token } = process.env;

    // fetch SHA if file exists
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
    let sha = null;
    const head = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'uploader' }});
    if (head.ok) sha = (await head.json()).sha;

    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const body = {
      message: message || `feat: upload ${safeName} via site`,
      content: base64, // base64 only (no data: prefix)
      branch,
      ...(sha ? { sha } : {})
    };

    const resp = await fetch(putUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'uploader' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: 'GitHub upload failed', details: err });
    }

    const result = await resp.json();

    // (Optional) CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json({
      ok: true,
      path,
      cdnUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}

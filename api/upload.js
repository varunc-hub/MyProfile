// api/upload.js
function isAuthed(req) {
  const cookies = req.headers.cookie || '';
  return cookies.split(';').some(c => c.trim().startsWith(`${process.env.COOKIE_NAME}=1`));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { filename, base64, message } = await req.json?.() || await new Response(req.body).json();
    if (!filename || !base64) return res.status(400).json({ error: 'filename and base64 required' });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path     = `assets/${safeName}`;

    const { GITHUB_OWNER: owner, GITHUB_REPO: repo, GITHUB_BRANCH: branch='main', GITHUB_TOKEN: token } = process.env;

    // Check if file exists to get SHA (required for overwrite)
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
    let sha = null;
    const head = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'uploader' }});
    if (head.ok) sha = (await head.json()).sha;

    // Commit
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const body = {
      message: message || `feat: upload ${safeName} via site`,
      content: base64,   // raw base64 without data URI prefix
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
    return res.status(200).json({
      ok: true,
      path,
      cdnUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}

// api/list-assets.js
export default async function handler(req, res) {
  try {
    const { GITHUB_OWNER: owner, GITHUB_REPO: repo, GITHUB_BRANCH: branch='main', GITHUB_TOKEN: token } = process.env;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/assets?ref=${branch}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'assets-lister' }});
    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: 'GitHub list failed', details: err });
    }
    const items = await resp.json();
    const images = items
      .filter(i => i.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(i.name))
      .map(i => ({
        name: i.name,
        raw: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/assets/${encodeURIComponent(i.name)}`
      }));
    return res.status(200).json({ ok: true, images });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}

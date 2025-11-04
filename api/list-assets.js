// api/list-assets.js
export default async function handler(req, res) {
  try {
    const {
      GITHUB_OWNER: owner,
      GITHUB_REPO: repo,
      GITHUB_BRANCH: branch = 'main',
      GITHUB_TOKEN: token
    } = process.env;

    if (!owner || !repo || !branch || !token) {
      return res.status(500).json({ error: 'Missing env vars', details: { owner: !!owner, repo: !!repo, branch: !!branch, token: !!token } });
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/assets?ref=${encodeURIComponent(branch)}`;
    const gh = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'assets-lister',
        Accept: 'application/vnd.github+json'
      }
    });

    // If assets/ doesn't exist yet, treat as empty instead of error
    if (gh.status === 404) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ ok: true, images: [] });
    }

    if (!gh.ok) {
      const errText = await gh.text().catch(() => '');
      return res.status(gh.status).json({ error: 'GitHub list failed', status: gh.status, details: errText });
    }

    const items = await gh.json();
    const images = (Array.isArray(items) ? items : [])
      .filter(i => i.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(i.name))
      .map(i => ({
        name: i.name,
        raw: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/assets/${encodeURIComponent(i.name)}`
      }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ok: true, images });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}

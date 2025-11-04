// api/env-check.js  (TEMP: remove after debugging)
export default function handler(req, res) {
  const env = {
    owner: !!process.env.GITHUB_OWNER,
    repo: !!process.env.GITHUB_REPO,
    branch: !!process.env.GITHUB_BRANCH,
    token: !!process.env.GITHUB_TOKEN,
  };
  return res.status(200).json({ ok: true, env });
}

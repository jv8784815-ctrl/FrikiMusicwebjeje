const REPO_OWNER = 'jv8784815-ctrl';
const REPO_NAME = 'repositpory-for-apk-3wfqewfd32134';

export default async function handler(req, res) {
  const ghHeaders = {
    'User-Agent': 'frikimusic-site',
    'Accept': 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) {
    ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const relRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      { headers: ghHeaders }
    );
    if (!relRes.ok) throw new Error('release fetch failed');
    const release = await relRes.json();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ tag: release.tag_name || null });
  } catch (err) {
    res.status(200).json({ tag: null });
  }
}

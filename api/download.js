export const config = { runtime: 'edge' };

const REPO_OWNER = 'jv8784815-ctrl';
const REPO_NAME = 'repositpory-for-apk-3wfqewfd32134';

const PLATFORM_EXT = {
  windows: '.exe',
  android: '.apk',
};

const CONTENT_TYPE = {
  windows: 'application/octet-stream',
  android: 'application/vnd.android.package-archive',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const platform = (url.searchParams.get('platform') || 'windows').toLowerCase();
  const ext = PLATFORM_EXT[platform];
  if (!ext) {
    return new Response(
      'Plataforma no reconocida. Usá ?platform=windows o ?platform=android.',
      { status: 400 }
    );
  }

  const ghHeaders = {
    'User-Agent': 'frikimusic-site',
    'Accept': 'application/vnd.github+json',
  };

  if (process.env.GITHUB_TOKEN) {
    ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const relRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=15`,
      { headers: ghHeaders }
    );
    if (!relRes.ok) throw new Error('releases fetch failed');
    const releases = await relRes.json();

    for (const release of releases) {
      if (release.draft) continue;
      const found = (release.assets || []).find(a => a.name.toLowerCase().endsWith(ext));
      if (found) { asset = found; break; }
    }
    if (!asset) throw new Error(`no ${ext} asset found in recent releases`);

    const fileRes = await fetch(asset.url, {
      headers: {
        ...ghHeaders,
        Accept: 'application/octet-stream',
      },
    });
    if (!fileRes.ok || !fileRes.body) throw new Error('asset download failed');

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': CONTENT_TYPE[platform],
        'Content-Disposition': `attachment; filename="${asset.name}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(
      'No se pudo obtener el instalador. Probá de nuevo en unos minutos.',
      { status: 502 }
    );
  }
}

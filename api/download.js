// Proxy de descarga: el visitante nunca ve el usuario/repo de GitHub.
// Todo el pedido a GitHub pasa por acá, del lado del servidor.
const REPO_OWNER = 'jv8784815-ctrl';
const REPO_NAME = 'repositpory-for-apk-3wfqewfd32134';

export default async function handler(req, res) {
  const ghHeaders = {
    'User-Agent': 'frikimusic-site',
    'Accept': 'application/vnd.github+json',
  };
  // Si el repo es privado de verdad, agregá un token en Vercel:
  // Settings -> Environment Variables -> GITHUB_TOKEN (permiso "Contents: read")
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
    const asset = (release.assets || []).find(a =>
      a.name.toLowerCase().endsWith('.exe')
    );
    if (!asset) throw new Error('no exe asset');

    const fileRes = await fetch(asset.url, {
      headers: {
        ...ghHeaders,
        Accept: 'application/octet-stream',
      },
    });
    if (!fileRes.ok) throw new Error('asset download failed');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${asset.name}"`);
    res.setHeader('Cache-Control', 'no-store');
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    res.status(200).send(buffer);
  } catch (err) {
    res.status(502).send('No se pudo obtener el instalador. Probá de nuevo en unos minutos.');
  }
}

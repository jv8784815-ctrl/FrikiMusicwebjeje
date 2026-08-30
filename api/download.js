// Proxy de descarga: el visitante nunca ve el usuario/repo de GitHub.
// Todo el pedido a GitHub pasa por acá, del lado del servidor.
//
// Usa el Edge Runtime + streaming para poder reenviar archivos grandes
// (como el APK) sin chocar con el límite de 4.5 MB que tienen las
// funciones serverless normales de Vercel al bufferear la respuesta.
export const config = { runtime: 'edge' };

const REPO_OWNER = 'jv8784815-ctrl';
const REPO_NAME = 'repositpory-for-apk-3wfqewfd32134';

// Windows y Android se publican en releases SEPARADAS (con distinto tag
// cada una), así que buscamos, entre las últimas releases publicadas,
// la más reciente que tenga un asset con la extensión de esta plataforma.
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
  // Si el repo es privado de verdad, agregá un token en Vercel:
  // Settings -> Environment Variables -> GITHUB_TOKEN (permiso "Contents: read")
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

    // Recorremos de la más nueva a la más vieja (orden por defecto de GitHub)
    // y nos quedamos con la primera que tenga el archivo de esta plataforma.
    let asset = null;
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

    // Reenviamos el body como stream, sin bufferearlo entero en memoria.
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

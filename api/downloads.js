const REPO = 'jv8784815-ctrl/repositpory-for-apk-3wfqewfd32134';

function isApk(asset) {
  return /\.apk$/i.test(asset.name || '');
}

async function fetchAllReleases(headers) {
  var releases = [];
  var page = 1;

  while (true) {
    var response = await fetch(
      'https://api.github.com/repos/' + REPO + '/releases?per_page=100&page=' + page,
      { headers: headers }
    );

    if (!response.ok) {
      throw new Error('GitHub API respondió ' + response.status);
    }

    var batch = await response.json();
    releases = releases.concat(batch);

    if (batch.length < 100) break;
    page += 1;
  }

  return releases;
}

module.exports = async function handler(req, res) {
  try {
    var headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
    }

    var releases = await fetchAllReleases(headers);

    var totalDownloads = 0;
    var latestRelease = null;
    var latestAsset = null;

    releases.forEach(function (release) {
      (release.assets || []).forEach(function (asset) {
        if (isApk(asset)) {
          totalDownloads += asset.download_count || 0;
          if (!latestRelease) {
            latestRelease = release;
            latestAsset = asset;
          }
        }
      });
    });

    var payload = {
      version: latestRelease ? (latestRelease.tag_name || latestRelease.name || null) : null,
      size: latestAsset ? latestAsset.size : null,
      publishedAt: latestRelease ? (latestRelease.published_at || latestRelease.created_at || null) : null,
      downloadUrl: latestAsset ? latestAsset.browser_download_url : null,
      totalDownloads: totalDownloads
    };

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json(payload);
  } catch (err) {
    res.status(502).json({ error: 'No se pudo leer el repositorio de releases' });
  }
};

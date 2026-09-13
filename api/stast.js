export const config = { runtime: 'edge' };

const DOWNLOADS_SET_KEY = 'fm_downloads';

export default async function handler() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return new Response(JSON.stringify({ total: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${url}/scard/${DOWNLOADS_SET_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('scard failed');
    const data = await res.json();

    return new Response(JSON.stringify({ total: data.result ?? 0 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ total: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

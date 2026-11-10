export const onRequestGet = async ({ request }: { request: Request }): Promise<Response> => {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return new Response('Invalid or missing image URL', { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new Response(`Failed to fetch image: HTTP ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('Content-Type') || 'image/jpeg';
    const blob = await res.arrayBuffer();

    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(`Error proxying image: ${err.message}`, { status: 500 });
  }
};

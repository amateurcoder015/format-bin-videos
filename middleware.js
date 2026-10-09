// Password gate for the whole site. Runs on Vercel before any file is served.
// Set ACCESS_PASSWORD in the Vercel project's environment variables.

const COOKIE = 'fb_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PUBLIC = new Set(['/login.html', '/favicon.ico']);

async function tokenFor(password) {
  const bytes = new TextEncoder().encode(`format-bin:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

function redirect(url, path, extraHeaders = {}) {
  return new Response(null, {
    status: 303,
    headers: { Location: new URL(path, url).toString(), 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const password = process.env.ACCESS_PASSWORD;

  if (url.pathname === '/api/login' && request.method === 'POST') {
    const form = await request.formData();
    const given = String(form.get('password') || '');
    // Fail closed: with no password configured, nobody gets in.
    if (!password || (await tokenFor(given)) !== (await tokenFor(password))) {
      return redirect(url, '/login.html?error=1');
    }
    const cookie = `${COOKIE}=${await tokenFor(password)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
    return redirect(url, '/', { 'Set-Cookie': cookie });
  }

  if (url.pathname === '/api/logout') {
    return redirect(url, '/login.html', { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  if (PUBLIC.has(url.pathname)) return;

  if (password && readCookie(request, COOKIE) === (await tokenFor(password))) return;

  return redirect(url, '/login.html');
}

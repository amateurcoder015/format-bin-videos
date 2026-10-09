// Login gate for the whole site. Runs on Vercel before any file is served.
// Only hashes live here, so the public repo does not reveal the password.
// To change the password, regenerate both hashes (see README).

const CRED_HASH = 'a4b025b3864127267af8bdd306f1629fd78be3dcf30ef85d1e4e84dc60869fc6';
const COOKIE_HASH = 'd7be353e44851ef4998a65854292de5433278eef00a77849edd019c0a62a57ee';

const COOKIE = 'fb_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PUBLIC = new Set(['/login.html', '/favicon.ico']);

async function sha256(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
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

  if (url.pathname === '/api/login' && request.method === 'POST') {
    const form = await request.formData();
    const password = String(form.get('password') || '');
    if ((await sha256(`format-bin-cred:${password}`)) !== CRED_HASH) {
      return redirect(url, '/login.html?error=1');
    }
    // The cookie is a secret preimage of COOKIE_HASH, so it cannot be forged from the repo.
    const token = await sha256(`format-bin-cookie:${password}`);
    const cookie = `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
    return redirect(url, '/', { 'Set-Cookie': cookie });
  }

  if (url.pathname === '/api/logout') {
    return redirect(url, '/login.html', { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  if (PUBLIC.has(url.pathname)) return;

  const token = readCookie(request, COOKIE);
  if (token && (await sha256(token)) === COOKIE_HASH) return;

  return redirect(url, '/login.html');
}

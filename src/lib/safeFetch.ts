import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { ValidationError } from '@/lib/auth/session';

/**
 * fetch() untuk URL dari input pengguna dengan proteksi SSRF:
 * hanya http/https, host harus ter-resolve ke IP publik, redirect divalidasi ulang.
 */

const MAX_REDIRECTS = 3;

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local / metadata cloud
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast & reserved
  );
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);

  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('fc') ||
    v6.startsWith('fd') || // unique local
    v6.startsWith('fe80') // link-local
  );
}

async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ValidationError('Format URL tidak valid (harus menyertakan http:// atau https://)');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ValidationError('Hanya URL http:// atau https:// yang diizinkan');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIP(a.address))) {
    throw new ValidationError('URL mengarah ke alamat jaringan internal dan tidak diizinkan');
  }
  return url;
}

export async function safeFetch(rawUrl: string, init: RequestInit = {}): Promise<Response> {
  let current = rawUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, { ...init, redirect: 'manual' });

    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, url).toString();
      continue;
    }
    return res;
  }
  throw new ValidationError('Terlalu banyak redirect pada URL berita');
}

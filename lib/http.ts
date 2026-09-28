// Minimal cookie-aware fetch client for the Workers runtime, replacing
// axios + axios-cookiejar-support + tough-cookie (which need Node's http module).
// Redirects are followed manually so cookies set on every hop are captured —
// the CAS flow bounces between innosoftfusiongo.com and auth.ucr.edu.

interface StoredCookie {
  name: string;
  value: string;
  domain: string;
  hostOnly: boolean;
  path: string;
}

function defaultPath(url: URL): string {
  const lastSlash = url.pathname.lastIndexOf('/');
  return lastSlash <= 0 ? '/' : url.pathname.slice(0, lastSlash);
}

function domainMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function pathMatches(requestPath: string, cookiePath: string): boolean {
  if (requestPath === cookiePath) return true;
  const prefix = cookiePath.endsWith('/') ? cookiePath : `${cookiePath}/`;
  return requestPath.startsWith(prefix);
}

export class CookieJar {
  private cookies: StoredCookie[] = [];

  storeFrom(url: URL, response: Response): void {
    for (const header of response.headers.getSetCookie()) {
      this.store(url, header);
    }
  }

  headerFor(url: URL): string {
    return this.cookies
      .filter((c) =>
        c.hostOnly ? url.hostname === c.domain : domainMatches(url.hostname, c.domain)
      )
      .filter((c) => pathMatches(url.pathname, c.path))
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
  }

  private store(url: URL, header: string): void {
    const [pair, ...attributes] = header.split(';');
    const eq = pair.indexOf('=');
    if (eq <= 0) return;

    const cookie: StoredCookie = {
      name: pair.slice(0, eq).trim(),
      value: pair.slice(eq + 1).trim(),
      domain: url.hostname,
      hostOnly: true,
      path: defaultPath(url),
    };
    let expired = false;

    for (const attribute of attributes) {
      const [rawKey, ...rest] = attribute.split('=');
      const key = rawKey.trim().toLowerCase();
      const value = rest.join('=').trim();

      if (key === 'domain' && value) {
        const domain = value.replace(/^\./, '').toLowerCase();
        if (!domainMatches(url.hostname, domain)) return; // reject cross-domain cookie
        cookie.domain = domain;
        cookie.hostOnly = false;
      } else if (key === 'path' && value.startsWith('/')) {
        cookie.path = value;
      } else if (key === 'max-age') {
        expired = Number(value) <= 0;
      } else if (key === 'expires') {
        expired = Date.parse(value) <= Date.now();
      }
    }

    this.cookies = this.cookies.filter(
      (c) => !(c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path)
    );
    if (!expired) this.cookies.push(cookie);
  }
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  maxRedirects?: number;
}

export interface ClientResponse {
  response: Response;
  url: URL;
}

export function createClient(defaults: { headers: Record<string, string>; timeoutMs: number }) {
  const jar = new CookieJar();

  return async function request(
    input: string,
    options: RequestOptions = {}
  ): Promise<ClientResponse> {
    const headers = new Headers({ ...defaults.headers, ...options.headers });
    const signal = AbortSignal.timeout(defaults.timeoutMs);
    const maxRedirects = options.maxRedirects ?? 5;
    let url = new URL(input);
    let method = options.method ?? 'GET';
    let body = options.body;

    for (let redirects = 0; ; redirects++) {
      const cookie = jar.headerFor(url);
      if (cookie) headers.set('Cookie', cookie);
      else headers.delete('Cookie');

      const response = await fetch(url, { method, headers, body, redirect: 'manual', signal });
      jar.storeFrom(url, response);

      const location = response.headers.get('Location');
      const isRedirect = response.status >= 300 && response.status < 400 && location;
      if (!isRedirect || redirects >= maxRedirects) {
        return { response, url };
      }

      await response.body?.cancel();
      url = new URL(location, url);
      // Match browser/axios behaviour: 303, and 301/302 after POST, become GET without a body
      if (response.status === 303 || (method === 'POST' && response.status <= 302)) {
        method = 'GET';
        body = undefined;
        headers.delete('Content-Type');
      }
    }
  };
}

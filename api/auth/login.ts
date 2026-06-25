import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const CAS_SERVICE_URL = 'https://innosoftfusiongo.com/sso/login/login-process-cas.php';
const LOGIN_START = 'https://innosoftfusiongo.com/sso/login/login-start.php?id=124';
const CAS_LOGIN = 'https://auth.ucr.edu/cas/login';
const LOGIN_FINISH = 'https://innosoftfusiongo.com/sso/login/login-finish.php';

const DEMO_TOKEN = 'DEMO_TOKEN_12345';

function buildSessionCookie(token: string): string {
  return [
    `srcgo_session=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Secure',
    'Path=/api',
    'Max-Age=3600',
  ].join('; ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  // Demo mode — bypass real auth
  if (username.toLowerCase() === 'demo') {
    res.setHeader('Set-Cookie', buildSessionCookie(DEMO_TOKEN));
    return res.status(200).json({ success: true, username: 'Demo User', isDemoMode: true });
  }

  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      timeout: 30_000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-us',
      },
    })
  );

  try {
    // Step 1: Initialize session — sets cookies required for auth flow
    await client.get(LOGIN_START, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    // Step 2: Get execution token from UCR CAS login page HTML
    const casUrl = `${CAS_LOGIN}?service=${encodeURIComponent(CAS_SERVICE_URL)}`;
    const casPage = await client.get<string>(casUrl, {
      headers: {
        Referer: LOGIN_START,
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const match = casPage.data.match(/name="execution" value="([^"]+)"/);
    if (!match) {
      return res.status(503).json({ success: false, error: 'Authentication service unavailable' });
    }
    const execution = match[1];

    const params = new URLSearchParams({
      username,
      password,
      execution,
      _eventId: 'submit',
      geolocation: '',
    });

    // Step 3: Submit credentials — CAS responds with 302 + Location containing ticket on success,
    // or 200 with an error page on failure. validateStatus: () => true prevents axios throwing
    // so we can inspect the response status directly instead of relying on the catch path.
    const submitResp = await client.post<string>(casUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://auth.ucr.edu',
        Referer: casUrl,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      maxRedirects: 0,
      validateStatus: () => true,
    });

    let ticketUrl: string | null = null;

    if (submitResp.status === 302) {
      const location = submitResp.headers['location'] as string | undefined;
      if (location?.includes('ticket=ST')) {
        ticketUrl = location;
      }
    } else {
      // 200 = CAS returned error page; check for ticket in body as fallback
      const html = (submitResp.data as string) ?? '';
      const ticketMatch = html.match(/ticket=(ST[^"&\s]+)/);
      if (ticketMatch) {
        ticketUrl = `${CAS_SERVICE_URL}?ticket=${ticketMatch[1]}`;
      }
    }

    if (!ticketUrl) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // Step 3.5: Visit the service URL to consume the ticket and establish the InnoSoft session.
    // The mobile XHR follows this redirect automatically before being aborted; we do it explicitly.
    await client.get(ticketUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: casUrl,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      maxRedirects: 5,
      validateStatus: () => true,
    });

    // Step 4: Complete login — fusion-token is returned in response headers
    const finishResp = await client.post(LOGIN_FINISH, '', {
      headers: {
        'Content-Type': 'multipart/form-data; boundary=',
        Origin: 'https://innosoftfusiongo.com',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept-Language': 'en-us',
        Referer: ticketUrl,
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const fusionToken = finishResp.headers['fusion-token'] as string | undefined;

    if (!fusionToken) {
      return res.status(502).json({ success: false, error: 'Could not retrieve session token' });
    }

    res.setHeader('Set-Cookie', buildSessionCookie(fusionToken));
    return res.status(200).json({ success: true, username, isDemoMode: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[login] auth error:', message);

    if (message.includes('timeout') || message.includes('ECONNREFUSED')) {
      return res.status(503).json({ success: false, error: 'Network error. Please try again.' });
    }

    return res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
}

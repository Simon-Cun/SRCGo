import { createClient } from '../../../lib/http';
import { DEMO_TOKEN, buildSessionCookie } from '../../../lib/session';

const CAS_SERVICE_URL = 'https://innosoftfusiongo.com/sso/login/login-process-cas.php';
const LOGIN_START = 'https://innosoftfusiongo.com/sso/login/login-start.php?id=124';
const CAS_LOGIN = 'https://auth.ucr.edu/cas/login';
const LOGIN_FINISH = 'https://innosoftfusiongo.com/sso/login/login-finish.php';

function ensureOk(response: Response, step: string): void {
  if (!response.ok) {
    throw new Error(`${step} failed with status ${response.status}`);
  }
}

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'POST') {
    return Response.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  const { username, password } = ((await request.json().catch(() => null)) ?? {}) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return Response.json(
      { success: false, error: 'Username and password are required' },
      { status: 400 }
    );
  }

  // Demo mode — bypass real auth
  if (username.toLowerCase() === 'demo') {
    return Response.json(
      { success: true, username: 'Demo User', isDemoMode: true },
      { headers: { 'Set-Cookie': buildSessionCookie(DEMO_TOKEN) } }
    );
  }

  const http = createClient({
    timeoutMs: 30_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-us',
    },
  });

  try {
    // Step 1: Initialize session — sets cookies required for auth flow
    const start = await http(LOGIN_START);
    ensureOk(start.response, 'Login start');
    await start.response.body?.cancel();

    // Step 2: Get execution token from UCR CAS login page HTML
    const casUrl = `${CAS_LOGIN}?service=${encodeURIComponent(CAS_SERVICE_URL)}`;
    const casPage = await http(casUrl, { headers: { Referer: LOGIN_START } });
    ensureOk(casPage.response, 'CAS login page');
    const casHtml = await casPage.response.text();

    const match = casHtml.match(/name="execution" value="([^"]+)"/);
    if (!match) {
      return Response.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 503 }
      );
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
    // or 200 with an error page on failure. Redirects are not followed so we can read the ticket.
    const submit = await http(casUrl, {
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://auth.ucr.edu',
        Referer: casUrl,
      },
      maxRedirects: 0,
    });

    let ticketUrl: string | null = null;

    if (submit.response.status === 302) {
      const location = submit.response.headers.get('Location');
      if (location?.includes('ticket=ST')) {
        ticketUrl = location;
      }
      await submit.response.body?.cancel();
    } else {
      // 200 = CAS returned error page; check for ticket in body as fallback
      const html = await submit.response.text();
      const ticketMatch = html.match(/ticket=(ST[^"&\s]+)/);
      if (ticketMatch) {
        ticketUrl = `${CAS_SERVICE_URL}?ticket=${ticketMatch[1]}`;
      }
    }

    if (!ticketUrl) {
      return Response.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Step 3.5: Visit the service URL to consume the ticket and establish the InnoSoft session.
    // The mobile XHR follows this redirect automatically before being aborted; we do it explicitly.
    const ticket = await http(ticketUrl, { headers: { Referer: casUrl } });
    await ticket.response.body?.cancel();

    // Step 4: Complete login — fusion-token is returned in response headers
    const finish = await http(LOGIN_FINISH, {
      method: 'POST',
      body: '',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=',
        Origin: 'https://innosoftfusiongo.com',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        Referer: ticketUrl,
      },
    });
    ensureOk(finish.response, 'Login finish');
    await finish.response.body?.cancel();

    const fusionToken = finish.response.headers.get('fusion-token');

    if (!fusionToken) {
      return Response.json(
        { success: false, error: 'Could not retrieve session token' },
        { status: 502 }
      );
    }

    return Response.json(
      { success: true, username, isDemoMode: false },
      { headers: { 'Set-Cookie': buildSessionCookie(fusionToken) } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[login] auth error:', message);

    if (err instanceof Error && err.name === 'TimeoutError') {
      return Response.json(
        { success: false, error: 'Network error. Please try again.' },
        { status: 503 }
      );
    }

    return Response.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
};

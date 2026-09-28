import { parse as parseCookies } from 'cookie';
import { DEMO_TOKEN, SESSION_COOKIE, clearSessionCookie } from '../../lib/session';

const BARCODE_URL = 'https://innosoftfusiongo.com/sso/api/barcode.php?id=124';

const DEMO_BARCODES = [
  'DEMO1234567890',
  'DEMO0987654321',
  'DEMO1357924680',
  'DEMO2468135790',
] as const;

let demoBarcodeIndex = 0;

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const cookies = parseCookies(request.headers.get('Cookie') ?? '');
  const fusionToken = cookies[SESSION_COOKIE];

  if (!fusionToken) {
    return Response.json({ error: 'SESSION_EXPIRED' }, { status: 401 });
  }

  // Demo mode
  if (fusionToken === DEMO_TOKEN) {
    const barcodeId = DEMO_BARCODES[demoBarcodeIndex % DEMO_BARCODES.length];
    demoBarcodeIndex++;
    return Response.json({ barcodeId });
  }

  try {
    const response = await fetch(BARCODE_URL, {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json;charset=utf-8;',
        Authorization: `Bearer ${fusionToken}`,
        'User-Agent': 'UCRSRC/268 CFNetwork/1240.0.4 Darwin/20.6.0',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401 || response.status === 403) {
      return Response.json(
        { error: 'SESSION_EXPIRED' },
        { status: 401, headers: { 'Set-Cookie': clearSessionCookie() } }
      );
    }
    if (!response.ok) {
      return Response.json({ error: 'Unable to load barcode. Please try again.' }, { status: 502 });
    }

    const data = (await response.json().catch(() => null)) as
      | { AppBarcodeIdNumber?: string }[]
      | null;
    const barcodeId = data?.[0]?.AppBarcodeIdNumber;

    if (!barcodeId) {
      return Response.json({ error: 'Invalid barcode response from server' }, { status: 502 });
    }

    return Response.json({ barcodeId });
  } catch {
    return Response.json({ error: 'Unable to load barcode. Please try again.' }, { status: 502 });
  }
};

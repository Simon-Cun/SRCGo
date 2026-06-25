import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { parse as parseCookies } from 'cookie';

const BARCODE_URL = 'https://innosoftfusiongo.com/sso/api/barcode.php?id=124';

const DEMO_TOKEN = 'DEMO_TOKEN_12345';
const DEMO_BARCODES = [
  'DEMO1234567890',
  'DEMO0987654321',
  'DEMO1357924680',
  'DEMO2468135790',
] as const;

let demoBarcodeIndex = 0;

function clearSessionCookie(): string {
  return 'srcgo_session=; HttpOnly; SameSite=Strict; Secure; Path=/api; Max-Age=0';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie ?? '');
  const fusionToken = cookies['srcgo_session'];

  if (!fusionToken) {
    return res.status(401).json({ error: 'SESSION_EXPIRED' });
  }

  // Demo mode
  if (fusionToken === DEMO_TOKEN) {
    const barcodeId = DEMO_BARCODES[demoBarcodeIndex % DEMO_BARCODES.length];
    demoBarcodeIndex++;
    return res.status(200).json({ barcodeId });
  }

  try {
    const response = await axios.get<{ AppBarcodeIdNumber?: string }[]>(BARCODE_URL, {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json;charset=utf-8;',
        Connection: 'keep-alive',
        Authorization: `Bearer ${fusionToken}`,
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'UCRSRC/268 CFNetwork/1240.0.4 Darwin/20.6.0',
      },
      timeout: 15_000,
    });

    const barcodeId = response.data?.[0]?.AppBarcodeIdNumber;

    if (!barcodeId) {
      return res.status(502).json({ error: 'Invalid barcode response from server' });
    }

    return res.status(200).json({ barcodeId });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        res.setHeader('Set-Cookie', clearSessionCookie());
        return res.status(401).json({ error: 'SESSION_EXPIRED' });
      }
    }
    return res.status(502).json({ error: 'Unable to load barcode. Please try again.' });
  }
}

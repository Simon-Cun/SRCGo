import { clearSessionCookie } from '../../../lib/session';

export const onRequest: PagesFunction = ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'DELETE') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  return Response.json({ success: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
};

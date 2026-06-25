import cors from 'cors';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import loginHandler from './api/auth/login';
import sessionHandler from './api/auth/session';
import barcodeHandler from './api/barcode';

const app = express();

app.use(express.json());

// Allow Vite dev server to call the API
app.use(
  cors({
    origin: 'http://localhost:8000',
    credentials: true,
  })
);

// Adapt Vercel handler signature to Express — safe because both extend
// IncomingMessage / ServerResponse and we only use the shared HTTP primitives.
type VercelHandler = (req: VercelRequest, res: VercelResponse) => unknown;
function adapt(handler: VercelHandler): express.RequestHandler {
  return (req, res) => handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
}

app.post('/api/auth/login', adapt(loginHandler));
app.delete('/api/auth/session', adapt(sessionHandler));
app.get('/api/barcode', adapt(barcodeHandler));
app.options('*', (_, res) => res.sendStatus(204));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

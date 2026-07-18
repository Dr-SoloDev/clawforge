import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ClawForgeMCPServer } from '../src/mcp/clawforge-mcp-server.js';

const app = express();
const PORT = process.env.PORT || 3100;
const SESSION_TTL_MS = 30 * 60 * 1000;

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.locals.sessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of app.locals.sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      session.transport.close().catch(() => {});
      app.locals.sessions.delete(id);
      console.error(`[clawforge-mcp-sse] Session ${id} expired (TTL ${SESSION_TTL_MS}ms)`);
    }
  }
}, 60_000).unref();

app.get('/mcp', async (req, res) => {
  try {
    const transport = new SSEServerTransport('/mcp', res);
    const forgeServer = new ClawForgeMCPServer();
    await forgeServer.server.connect(transport);

    const sessionId = transport.sessionId;
    app.locals.sessions.set(sessionId, { forgeServer, transport, createdAt: Date.now() });

    res.on('close', () => {
      app.locals.sessions.delete(sessionId);
    });

    console.error(`[clawforge-mcp-sse] Session ${sessionId} started`);
  } catch (err) {
    console.error('[clawforge-mcp-sse] SSE connection error:', err.message);
    if (!res.headersSent) {
      res.status(500).end('Internal Server Error');
    }
  }
});

app.post('/mcp', async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    res.status(400).end('Missing sessionId query parameter');
    return;
  }

  const session = app.locals.sessions.get(sessionId);
  if (!session) {
    res.status(404).end('Session not found');
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res, req.body);
  } catch (err) {
    console.error(`[clawforge-mcp-sse] POST error session ${sessionId}:`, err.message);
    if (!res.headersSent) {
      res.status(500).end('Internal Server Error');
    }
  }
});

let depCache = null;
async function checkDependencies() {
  if (depCache) return depCache;
  const { execSync } = await import('child_process');
  const which = (cmd) => { try { execSync(`which ${cmd}`, { stdio: 'ignore' }); return true; } catch { return false; } };
  const ffmpeg = which('ffmpeg');
  const ffprobe = which('ffprobe');
  let playwright = false;
  try { const { chromium } = await import('playwright'); await chromium.executablePath(); playwright = true; } catch {}
  let edgeTts = false;
  try { execSync('edge-tts --list-voices', { timeout: 5000, stdio: 'ignore' }); edgeTts = true; } catch {}
  depCache = { ffmpeg, ffprobe, playwright, edgeTts };
  return depCache;
}

app.get('/health', async (_req, res) => {
  const deps = await checkDependencies();
  res.json({
    status: deps.ffmpeg && deps.ffprobe ? 'ok' : 'degraded',
    sessions: app.locals.sessions.size,
    dependencies: deps,
  });
});

app.listen(PORT, () => {
  console.error(`[clawforge-mcp-sse] Server running on http://0.0.0.0:${PORT}/mcp`);
  console.error(`[clawforge-mcp-sse] Health check at http://0.0.0.0:${PORT}/health`);
});
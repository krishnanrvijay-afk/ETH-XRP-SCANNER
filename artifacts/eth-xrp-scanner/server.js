import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app      = express();
const PORT     = process.env.PORT      || 3000;
const BASE     = (process.env.BASE_PATH || '').replace(/\/$/, ''); // e.g. "/eth-xrp-scanner"

// ── SESSION WINDOWS (UTC hours) ────────────────────────────────────────────────
// Matches TOKEN_CONFIG.bestHoursUTC in the client
const SESSION_WINDOWS = {
  ETH: new Set([4,5,6,7,8,9,10,11]),
  XRP: new Set([2,3,4,10,11,12]),
};

function utcHourNow() { return new Date().getUTCHours(); }

function isBlackedOut(pair) {
  const w = SESSION_WINDOWS[pair];
  return w ? !w.has(utcHourNow()) : false;
}

function pairFromMexcSymbol(sym) {
  if (!sym) return null;
  if (sym.toUpperCase().includes('XRP')) return 'XRP';
  if (sym.toUpperCase().includes('ETH')) return 'ETH';
  return null;
}

function pairFromCoin(coin) {
  if (!coin) return null;
  const c = coin.toUpperCase();
  if (c === 'XRP') return 'XRP';
  if (c === 'ETH') return 'ETH';
  return null;
}

// ── MEXC PROXY ─────────────────────────────────────────────────────────────────
app.get(['/proxy/mexc/kline', BASE + '/proxy/mexc/kline'], async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pair = pairFromMexcSymbol(req.query.symbol);
  if (pair && isBlackedOut(pair)) {
    return res.json({ blackout: true, pair, message: 'Outside session window — server blackout enforced' });
  }
  try {
    const symbol   = req.query.symbol   || '';
    const interval = req.query.interval || 'Min1';
    const limit    = req.query.limit    || '25';
    const r = await fetch(
      `https://contract.mexc.com/api/v1/contract/kline/${symbol}?interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: String(e) });
  }
});

app.get(['/proxy/mexc/depth', BASE + '/proxy/mexc/depth'], async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pair = pairFromMexcSymbol(req.query.symbol);
  if (pair && isBlackedOut(pair)) {
    return res.json({ blackout: true, pair, message: 'Outside session window — server blackout enforced' });
  }
  try {
    const symbol = req.query.symbol || '';
    const limit  = req.query.limit  || '10';
    const r = await fetch(
      `https://contract.mexc.com/api/v1/contract/depth/${symbol}?limit=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: String(e) });
  }
});

// ── HYPERLIQUID PROXY ──────────────────────────────────────────────────────────
app.get(['/proxy/hl/candles', BASE + '/proxy/hl/candles'], async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pair = pairFromCoin(req.query.coin);
  if (pair && isBlackedOut(pair)) {
    return res.json({ blackout: true, pair, message: 'Outside session window — server blackout enforced' });
  }
  try {
    const coin      = req.query.coin      || 'ETH';
    const startTime = parseInt(req.query.startTime) || (Date.now() - 1800000);
    const endTime   = parseInt(req.query.endTime)   || Date.now();
    const r = await fetch('https://api.hyperliquid.xyz/info', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: 'candleSnapshot', req: { coin, interval: '1m', startTime, endTime } }),
      signal:  AbortSignal.timeout(10000),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json([]);
  }
});

app.get(['/proxy/hl/depth', BASE + '/proxy/hl/depth'], async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pair = pairFromCoin(req.query.coin);
  if (pair && isBlackedOut(pair)) {
    return res.json({ blackout: true, pair, message: 'Outside session window — server blackout enforced' });
  }
  try {
    const coin = req.query.coin || 'ETH';
    const r = await fetch('https://api.hyperliquid.xyz/info', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type: 'l2Book', coin }),
      signal:  AbortSignal.timeout(10000),
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ levels: [] });
  }
});

// ── STATIC FILES ───────────────────────────────────────────────────────────────
if (BASE) {
  app.use(BASE, express.static(path.join(__dirname, 'public')));
  app.get(BASE + '/', (_req, res) => res.redirect(BASE + '/eth_xrp_scanner.html'));
  app.get(BASE,       (_req, res) => res.redirect(BASE + '/eth_xrp_scanner.html'));
  app.get(BASE + '/*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'eth_xrp_scanner.html')));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (_req, res) => res.redirect('/eth_xrp_scanner.html'));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'eth_xrp_scanner.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ETH-XRP Scanner on port ${PORT}${BASE || '/'}`);
});

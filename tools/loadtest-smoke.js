#!/usr/bin/env node
/* eslint-disable no-console */
// Zero-dependency smoke load test for key APIs.
// Usage:
// node tools/loadtest-smoke.js --base http://127.0.0.1:3002 --path /api/health --concurrency 20 --duration 180

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const base = getArg('base', 'http://127.0.0.1:3002');
const path = getArg('path', '/api/health');
const method = (getArg('method', 'GET') || 'GET').toUpperCase();
const concurrency = Math.max(1, Number(getArg('concurrency', 20)));
const duration = Math.max(1, Number(getArg('duration', 180))); // seconds
const body = getArg('body', '');

const startedAt = Date.now();
const stopAt = startedAt + duration * 1000;

const results = {
  ok: 0,
  fail: 0,
  latencies: [],
  statusCodes: {}
};

async function worker() {
  while (Date.now() < stopAt) {
    const reqStarted = Date.now();
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body || undefined
      });
      const latency = Date.now() - reqStarted;
      results.latencies.push(latency);
      results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
      if (response.ok) {
        results.ok += 1;
      } else {
        results.fail += 1;
      }
    } catch (_) {
      const latency = Date.now() - reqStarted;
      results.latencies.push(latency);
      results.fail += 1;
      results.statusCodes.NETWORK_ERROR = (results.statusCodes.NETWORK_ERROR || 0) + 1;
    }
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

async function main() {
  console.log(`[loadtest] base=${base} path=${path} method=${method} c=${concurrency} duration=${duration}s`);
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const total = results.ok + results.fail;
  const elapsedSec = (Date.now() - startedAt) / 1000;
  const rps = total / elapsedSec;
  const sorted = [...results.latencies].sort((a, b) => a - b);
  const p50 = percentile(sorted, 50);
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const errRate = total > 0 ? (results.fail / total) * 100 : 0;

  console.log('');
  console.log('=== loadtest summary ===');
  console.log(`requests: ${total}`);
  console.log(`ok: ${results.ok}`);
  console.log(`fail: ${results.fail}`);
  console.log(`error_rate: ${errRate.toFixed(2)}%`);
  console.log(`rps: ${rps.toFixed(2)}`);
  console.log(`latency_ms p50=${p50} p95=${p95} p99=${p99}`);
  console.log(`status_codes: ${JSON.stringify(results.statusCodes)}`);

  process.exit(errRate > 1 ? 1 : 0);
}

main().catch((err) => {
  console.error('[loadtest] fatal:', err.message);
  process.exit(1);
});


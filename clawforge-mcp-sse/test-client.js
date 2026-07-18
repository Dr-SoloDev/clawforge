#!/usr/bin/env node

const endpoint = process.env.MCP_ENDPOINT || 'http://127.0.0.1:3100/mcp';

const testScript = {
  project: {
    name: 'test-sse',
    url: 'https://example.com',
  },
  scenes: [
    {
      name: 'homepage',
      narration: 'This is a test scene for the SSE integration.',
      actions: [
        { type: 'goto', url: 'https://example.com' },
        { type: 'wait', duration: 1000 },
      ],
    },
  ],
};

async function test() {
  console.log('Testing ClawForge MCP SSE -- Real Tool Call\n');

  const { EventSource } = await import('eventsource');

  const es = new EventSource(endpoint);

  es.addEventListener('endpoint', async (event) => {
    const postUrl = event.data;
    const fullUrl = postUrl.startsWith('http') ? postUrl : `http://127.0.0.1:3100${postUrl}`;
    console.log('SSE connected');

    console.log('\n-- Test 1: tools/list --');
    const listRes = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: '1', method: 'tools/list', params: {} }),
    });
    console.log('POST status:', listRes.status);

    console.log('\n-- Test 2: clawforge_dry_run --');
    const dryRunRes = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '2',
        method: 'tools/call',
        params: { name: 'clawforge_dry_run', arguments: { script: testScript } },
      }),
    });
    console.log('POST status:', dryRunRes.status);

    console.log('\n-- Test 3: clawforge_check_dependencies --');
    const depRes = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '3',
        method: 'tools/call',
        params: { name: 'clawforge_check_dependencies', arguments: {} },
      }),
    });
    console.log('POST status:', depRes.status);
  });

  es.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.result?.tools) {
        console.log('  Tools:', msg.result.tools.map(t => t.name).join(', '));
      } else if (msg.id === '2') {
        const text = JSON.parse(msg.result.content[0].text);
        console.log('  Valid:', text.valid, '| Errors:', text.errors?.length || 0, '| Warnings:', text.warnings?.length || 0);
      } else if (msg.id === '3') {
        const text = JSON.parse(msg.result.content[0].text);
        const deps = text.dependencies || text;
        console.log('  Dependencies checked:', Object.keys(deps).length, 'items');
      }
    } catch {}
  });

  setTimeout(() => {
    console.log('\nAll POST requests sent. Responses received via SSE events above.');
    es.close();
    process.exit(0);
  }, 5000);
}

test();
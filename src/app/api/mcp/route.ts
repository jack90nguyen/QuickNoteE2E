import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { authenticateBearer } from '@/lib/mcp-auth';
import { createMcpServer } from '@/lib/mcp-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unauthorized() {
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized' },
      id: null,
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="QuickNote MCP"',
      },
    }
  );
}

async function handle(req: Request) {
  const auth = await authenticateBearer(req);
  if (!auth) return unauthorized();

  const server = createMcpServer(auth.userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } catch (error) {
    console.error('MCP request failed', error);
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await server.close().catch(() => undefined);
  }
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function DELETE(req: Request) {
  return handle(req);
}

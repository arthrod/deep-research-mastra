import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

interface Bindings {
  ASSETS: Fetcher
  MASTRA_BASE_URL?: string
}

const api = new Hono<{ Bindings: Bindings }>()

api.use('*', logger())
api.use('*', cors())

api.get('/health', (c) =>
  c.json({ status: 'ok', service: 'deep-research-mastra', time: new Date().toISOString() }),
)

const proxyToMastra = async (c: {
  env: Bindings
  req: { method: string; path: string; url: string; raw: Request }
}, prefixToStrip: string): Promise<Response> => {
  const base = c.env.MASTRA_BASE_URL
  if (base === undefined || base === '') {
    return new Response(
      JSON.stringify({
        error: 'MASTRA_BASE_URL not configured. Set it as a Worker var to proxy to a Mastra service.',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  }
  const path = c.req.path.slice(prefixToStrip.length)
  const search = new URL(c.req.url).search
  const target = base.replace(/\/+$/, '') + path + search
  const init: RequestInit = {
    method: c.req.method,
    headers: c.req.raw.headers,
  }
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    init.body = await c.req.raw.arrayBuffer()
  }
  return fetch(target, init)
}

api.get('/agents', (c) => proxyToMastra(c, '/api'))
api.get('/workflows', (c) => proxyToMastra(c, '/api'))
api.all('/mastra/*', (c) => proxyToMastra(c, '/api/mastra'))

const app = new Hono<{ Bindings: Bindings }>()

app.route('/api', api)

app.notFound(async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app

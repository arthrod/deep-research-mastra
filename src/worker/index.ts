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

const STRIPPED_HEADERS = new Set([
  'cookie',
  'set-cookie',
  'host',
  'connection',
  'content-length',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
])

const sanitizeHeaders = (incoming: Headers): Headers => {
  const out = new Headers()
  incoming.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (STRIPPED_HEADERS.has(lower)) {
      return
    }
    if (lower.startsWith('cf-')) {
      return
    }
    out.set(key, value)
  })
  return out
}

const buildUpstreamUrl = (base: string, requestUrl: string, prefixToStrip: string): URL => {
  const upstream = new URL(base)
  const reqUrl = new URL(requestUrl)
  const rawSuffix = reqUrl.pathname.slice(prefixToStrip.length)
  const normalizedSuffix = '/' + rawSuffix.replace(/^\/+/, '')
  const basePath = upstream.pathname.replace(/\/+$/, '')
  upstream.pathname = basePath + normalizedSuffix
  upstream.search = reqUrl.search
  upstream.hash = ''
  return upstream
}

const proxyToMastra = async (
  c: { env: Bindings; req: { method: string; url: string; raw: Request } },
  prefixToStrip: string,
): Promise<Response> => {
  const base = c.env.MASTRA_BASE_URL
  if (base === undefined || base === '') {
    return new Response(
      JSON.stringify({
        error: 'MASTRA_BASE_URL not configured. Set it as a Worker var to proxy to a Mastra service.',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  }
  const upstream = buildUpstreamUrl(base, c.req.url, prefixToStrip)
  const init: RequestInit = {
    method: c.req.method,
    headers: sanitizeHeaders(c.req.raw.headers),
  }
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    init.body = await c.req.raw.arrayBuffer()
  }
  return fetch(upstream.toString(), init)
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

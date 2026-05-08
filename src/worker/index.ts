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

api.get('/agents', (c) =>
  c.json({
    agents: [
      'researchAgent',
      'reportAgent',
      'evaluationAgent',
      'learningExtractionAgent',
      'webSummarizationAgent',
      'ragAgent',
      'githubAgent',
      'monitorAgent',
      'planningAgent',
      'qualityAssuranceAgent',
      'publisherAgent',
      'copywriterAgent',
      'editorAgent',
      'assistant',
      'voiceAgent',
    ],
  }),
)

api.get('/workflows', (c) =>
  c.json({
    workflows: [
      'researchWorkflow',
      'generateReportWorkflow',
      'comprehensiveResearchWorkflow',
      'githubPlanningWorkflow',
      'githubQualityWorkflow',
    ],
  }),
)

api.all('/mastra/*', async (c) => {
  const base = c.env.MASTRA_BASE_URL
  if (base === undefined || base === '') {
    return c.json(
      { error: 'MASTRA_BASE_URL not configured. Set it as a Worker var to proxy to a Mastra service.' },
      503,
    )
  }
  const path = c.req.path.replace(/^\/api\/mastra/, '')
  const target = new URL(path + (c.req.url.includes('?') ? c.req.url.slice(c.req.url.indexOf('?')) : ''), base)
  const init: RequestInit = {
    method: c.req.method,
    headers: c.req.raw.headers,
  }
  if (!['GET', 'HEAD'].includes(c.req.method)) {
    init.body = await c.req.raw.arrayBuffer()
  }
  return fetch(target.toString(), init)
})

const app = new Hono<{ Bindings: Bindings }>()

app.route('/api', api)

app.notFound(async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { Layout } from './Layout'
import { Home } from './pages/Home'
import { Research } from './pages/Research'
import { Agents } from './pages/Agents'
import { Workflows } from './pages/Workflows'

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/research',
  component: Research,
})

const agentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents',
  component: Agents,
})

const workflowsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workflows',
  component: Workflows,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  researchRoute,
  agentsRoute,
  workflowsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

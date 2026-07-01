import { test, expect } from '@playwright/test'

// End-to-end coverage of the web + API together — the integration the unit tests can't reach.
const API = 'http://localhost:5238'

// Deterministic starting point: wipe the workspace and the onboarding flag so the first-run modal
// shows and auto-opens the invoice report every run.
test.beforeEach(async ({ page, request }) => {
  await request.delete(`${API}/api/workspace/nodes?path=examples`).catch(() => {})
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem('buelo.onboarded')
      window.localStorage.removeItem('buelo.reportSettings')
    } catch {
      /* ignore */
    }
  })
})

// The visible one of the app's duplicated (desktop + mobile) editor regions.
const visibleTab = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('button', { name }).filter({ visible: true }).first()

test('creates the showcase and renders a report to PDF end-to-end', async ({ page }) => {
  await page.goto('/')

  // First-run modal → create the example showcase; it auto-opens the invoice report.
  await page.getByRole('button', { name: /create examples/i }).click()
  await expect(visibleTab(page, 'invoice.report.yml')).toBeVisible()

  // Render the active report: the API compiles it and returns a PDF, shown in a blob iframe.
  await page
    .getByRole('button', { name: 'Render', exact: true })
    .filter({ visible: true })
    .first()
    .click()

  await expect(page.locator('iframe').filter({ visible: true }).first()).toHaveAttribute(
    'src',
    /^blob:/,
    { timeout: 30_000 },
  )
})

test('the open-editors overflow menu exposes Save all', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /create examples/i }).click()
  await expect(visibleTab(page, 'invoice.report.yml')).toBeVisible()

  // The "⌄" overflow button (title="Open editors") opens a menu with a Save all action.
  await page.getByRole('button', { name: 'Open editors' }).filter({ visible: true }).first().click()
  await expect(page.getByRole('button', { name: /save all/i })).toBeVisible()
})

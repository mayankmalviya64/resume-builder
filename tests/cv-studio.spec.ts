import { expect, test } from '@playwright/test'

test('edits, adds a page, previews, and saves local history', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'YOUR NAME' }).first()).toBeVisible()
  await expect(page.locator('.a4-page')).toHaveCount(2)
  const overflow = await page.locator('.a4-page').evaluateAll((pages) =>
    pages.map((item) => item.scrollHeight > item.clientHeight + 2),
  )
  expect(overflow).toEqual([false, false])
  await page.locator('.a4-page').first().click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.type('A TEST CV')
  await expect(page.locator('.a4-page').first()).toContainText('A TEST CV')

  await page.getByRole('button', { name: 'Add A4 page' }).click()
  await expect(page.locator('.a4-page')).toHaveCount(3)

  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByText('PRINT PREVIEW')).toBeVisible()
  await page.getByRole('button', { name: 'Edit' }).click()

  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: 'Version history' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Manual save/ })).toBeVisible()
})

test('keeps the toolbar and export action available on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: 'Formatting toolbar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
  await expect(page.locator('.a4-shell').first()).toHaveCSS('overflow', 'hidden')
})

import { expect, test } from '@playwright/test'

test('edits, paginates overflow, previews, saves, and resets', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'YOUR NAME' }).first()).toBeVisible()
  await expect(page.locator('.a4-page')).toHaveCount(1)
  const overflow = await page.locator('.a4-page').evaluateAll((pages) =>
    pages.map((item) => item.scrollHeight > item.clientHeight + 2),
  )
  expect(overflow).toEqual([false])
  await page.locator('.a4-page').first().click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.type('A TEST CV')
  await expect(page.locator('.a4-page').first()).toContainText('A TEST CV')

  // Overflow is split at top-level block boundaries, creating page 2 only now.
  await page.locator('.a4-page').first().evaluate((element) => {
    element.innerHTML += Array.from({ length: 180 }, (_, index) => `<p>Additional achievement ${index + 1}</p>`).join('')
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
  })
  await expect.poll(async () => page.locator('.a4-page').count()).toBeGreaterThan(1)

  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByText('PRINT PREVIEW')).toBeVisible()
  await page.getByRole('button', { name: 'Edit' }).click()

  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: 'Version history' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Manual save/ })).toBeVisible()

  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByRole('heading', { name: 'Reset this workspace?' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset workspace' }).click()
  await expect(page.locator('.a4-page')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'YOUR NAME' }).first()).toBeVisible()
})

test('keeps the toolbar and export action available on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: 'Formatting toolbar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
  await expect(page.locator('.a4-shell').first()).toHaveCSS('overflow', 'hidden')
})

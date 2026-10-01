import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (['http:', 'https:'].includes(location.protocol)) localStorage.setItem('treasure-tide:language:v1', 'en');
  });
});

test('stale storage and team tabs cannot hijack explicit host, projector or landing routes', async ({ page, context }) => {
  const errors = [];
  const recordErrors = tab => {
    tab.on('pageerror', error => errors.push(error.message));
    tab.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  };
  recordErrors(page);
  await page.goto('/');
  await page.evaluate(() => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ['teamId', 'joinToken', 'role', 'lastRoute', 'currentTeam', 'joinedTeam', 'userType', 'viewMode']) {
        storage.setItem(key, key === 'lastRoute' ? '/team/stale' : 'team');
      }
    }
    localStorage.setItem('treasure-tide:watch:v2', JSON.stringify('missing-game'));
  });
  await page.reload();
  await expect(page.locator('.landing')).toBeVisible();
  await page.getByRole('link', { name: "Captain's quarters" }).click();
  await expect(page.locator('.admin-shell')).toBeVisible();
  await expect(page.locator('.admin-content')).not.toHaveAttribute('inert');
  for (const name of ['Routing crew', 'Other crew']) {
    await page.getByRole('button', { name: 'Add team', exact: true }).click();
    await page.getByLabel('Team name', { exact: true }).fill(name);
    await page.getByRole('dialog').getByRole('button', { name: 'Add team', exact: true }).click();
  }
  const url = await page.getByLabel('Join link for Routing crew', { exact: true }).inputValue();
  const hostCredential = await page.evaluate(() => localStorage.getItem('treasure-tide:host:v2'));
  const team = await context.newPage();
  recordErrors(team);
  await team.goto(url);
  await team.getByRole('link', { name: 'Join as Routing crew' }).click();
  await expect(team.locator('.team-identity')).toContainText('Routing crew');
  await expect(team.locator('.team-identity')).not.toContainText('Other crew');
  // Stop the host subscription, whose legitimate presence updates also save its game ID.
  await page.goto('about:blank');
  await team.evaluate(() => localStorage.setItem('treasure-tide:watch:v2', JSON.stringify('unchanged-by-team')));
  await team.reload();
  await expect(team.locator('.team-identity')).toContainText('Routing crew');
  expect(await team.evaluate(() => JSON.parse(localStorage.getItem('treasure-tide:watch:v2')))).toBe('unchanged-by-team');
  const admin = await context.newPage();
  recordErrors(admin);
  await admin.goto('/admin');
  await expect(admin.locator('.admin-content')).not.toHaveAttribute('inert');
  await expect(admin.locator('.team-card')).toHaveCount(2);
  await admin.reload();
  await expect(admin.locator('.team-card')).toHaveCount(2);
  expect(await admin.evaluate(() => localStorage.getItem('treasure-tide:host:v2'))).toBe(hostCredential);
  for (const path of ['/admin/', '/ADMIN']) {
    await admin.goto(path);
    await expect(admin.locator('.admin-content')).not.toHaveAttribute('inert');
    await expect(admin.locator('.team-card')).toHaveCount(2);
  }
  await admin.goto('/game');
  await expect(admin.locator('.game-screen')).toBeVisible();
  await admin.goto('/results');
  await expect.poll(() => admin.evaluate(async () => (await import('/src/services/SocketGameService.js')).gameService.connection.ready)).toBe(true);
  expect(new URL(admin.url()).pathname).toBe('/results');
  await admin.goto('/');
  await expect(admin.locator('.landing')).toBeVisible();
  expect(errors).toEqual([]);
});

test('missing realtime server leaves harbor and Admin reachable with actions disabled', async ({ page }) => {
  await page.route('**/socket.io/**', route => route.abort());
  await page.goto('/admin');
  await expect(page.locator('.admin-shell')).toBeVisible();
  await expect(page.locator('.admin-content')).toHaveAttribute('inert');
  await expect(page.getByText('Start both servers', { exact: false })).toBeVisible();
  await expect(page.locator('.team-screen')).toHaveCount(0);
  await page.getByRole('link', { name: /Back to harbor/ }).click();
  await expect(page.locator('.landing')).toBeVisible();
  await page.getByRole('link', { name: "Captain's quarters" }).click();
  await expect(page.locator('.admin-shell')).toBeVisible();
});

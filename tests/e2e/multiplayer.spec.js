import { test, expect } from '@playwright/test';
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (!['http:', 'https:'].includes(location.protocol)) return;
    if (!localStorage.getItem('treasure-tide:language:v1')) localStorage.setItem('treasure-tide:language:v1', 'en');
  });
});
import { networkInterfaces } from 'node:os';
const interfaces = Object.entries(networkInterfaces()).sort(([a], [b]) => Number(/wi-?fi|wlan/i.test(b)) - Number(/wi-?fi|wlan/i.test(a)));
const lan = interfaces.flatMap(([, list]) => list).find(n => n.family === 'IPv4' && !n.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address))?.address;

test('independent mobile browser joins by QR link, answers, reconnects, and loses access after regeneration', async ({ browser }) => {
  test.skip(!lan, 'No LAN interface available on this computer.');
  const origin = `http://${lan}:5175`;
  const hostContext = await browser.newContext();
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const screenContext = await browser.newContext();
  const host = await hostContext.newPage(), phone = await phoneContext.newPage(), screen = await screenContext.newPage();
  await Promise.all([hostContext, phoneContext, screenContext].map(c => c.addInitScript(() => {
    if (['http:', 'https:'].includes(location.protocol)) localStorage.setItem('treasure-tide:language:v1', 'en');
  })));
  const errors = [];
  [host, phone, screen].forEach(p => p.on('pageerror', e => errors.push(e.message)));
  try {
    await host.goto(`${origin}/admin`);
    await host.getByRole('button', { name: 'Add team', exact: true }).click();
    await host.getByLabel('Team name', { exact: true }).fill('Black Sharks');
    await host.getByLabel('Starting crew').fill('6');
    await host.getByRole('dialog').getByRole('button', { name: 'Add team', exact: true }).click();
    await host.getByRole('button', { name: /Question chest/ }).click();
    for (const [question, correct] of [['Which ocean borders India?', 'B'], ['Which ocean is the largest on Earth?', 'C']]) {
      await host.getByRole('button', { name: 'Add question', exact: true }).click();
      const dialog = host.getByRole('dialog');
      await dialog.getByRole('textbox', { name: 'Question', exact: true }).fill(question);
      for (const [i, answer] of ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'].entries()) {
        await dialog.getByLabel(`Answer ${'ABCD'[i]}`, { exact: true }).fill(answer);
      }
      await dialog.getByLabel(`Mark ${correct} correct`).check();
      await dialog.getByRole('button', { name: 'Add question', exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
    await host.getByRole('button', { name: /Fleet & crew/ }).click();
    const card = host.locator('.team-card').filter({ has: host.getByRole('heading', { name: 'Black Sharks', exact: true }) });
    await expect(card.getByRole('button', { name: 'Enlarge QR for Black Sharks' })).toBeVisible();
    const joinUrl = await card.getByLabel('Join link for Black Sharks').inputValue();
    expect(joinUrl).toMatch(new RegExp(`^http://${lan}:5175/join/[\\w-]{32}$`));
    await card.getByRole('button', { name: 'Enlarge QR for Black Sharks' }).click();
    await expect(host.getByRole('dialog').locator('svg')).toHaveCount(1);
    await host.getByRole('button', { name: 'Close dialog' }).click();
    await card.getByRole('button', { name: 'Show Large QR', exact: true }).click();
    await expect(host.getByRole('dialog')).toContainText(joinUrl);
    await host.getByRole('button', { name: 'Close dialog' }).click();
    await card.getByRole('button', { name: 'Copy Join Link' }).click();
    await expect(card.getByRole('status')).toHaveText('Link copied');
    await phone.goto(joinUrl);
    await phone.getByRole('link', { name: 'Join as Black Sharks' }).click();
    await expect(phone.getByRole('heading', { name: "You're connected!" })).toBeVisible();
    await expect(card.getByText('Connected', { exact: false })).toBeVisible();
    const publicUrl = await host.getByRole('link', { name: /Open game screen/ }).getAttribute('href');
    await screen.goto(origin + publicUrl);
    await host.getByRole('button', { name: 'Start game', exact: true }).click();
    await host.getByRole('button', { name: 'Show question', exact: true }).click();
    await expect(phone.getByRole('button', { name: 'B Indian Ocean' })).toBeVisible();
    await expect(screen.getByRole('heading', { name: 'Which ocean borders India?' })).toBeVisible();
    for (const device of [phone, screen]) {
      const snapshot = await device.evaluate(async () => (await import('/src/services/SocketGameService.js')).gameService.snapshot);
      expect(JSON.stringify(snapshot)).not.toContain('correctAnswerId');
      expect(JSON.stringify(snapshot)).not.toContain('joinToken');
    }
    expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await phone.screenshot({ path: 'artifacts/team-mobile-lan.png' });
    await phone.getByRole('button', { name: 'B Indian Ocean' }).click();
    await expect(phone.getByRole('heading', { name: 'Answer Submitted' })).toBeVisible();
    await expect(phone.locator('.team-answer:disabled')).toHaveCount(4);
    await expect(phone.getByRole('button', { name: 'B Indian Ocean' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.getByText('ANSWERED', { exact: true })).toBeVisible();
    await phoneContext.setOffline(true);
    await expect(card.getByText('Disconnected', { exact: false })).toBeVisible({ timeout: 45000 });
    await phoneContext.setOffline(false);
    await expect(phone.getByRole('heading', { name: 'Answer Submitted' })).toBeVisible({ timeout: 15000 });
    await phone.reload();
    await expect(phone.getByRole('heading', { name: 'Answer Submitted' })).toBeVisible();
    await host.getByRole('button', { name: 'Lock answers', exact: true }).click();
    await host.getByRole('button', { name: 'Reveal correct answer', exact: true }).click();
    await expect(phone.getByRole('heading', { name: 'Correct!', exact: true })).toBeVisible();
    await expect(screen.locator('.is-correct')).toContainText('Indian Ocean');
    await host.getByRole('button', { name: 'Process round', exact: true }).click();
    await expect(phone.getByText('Crew Remaining: 6', { exact: true })).toBeVisible();
    await expect.poll(() => host.evaluate(async () => {
      const team = (await import('/src/services/SocketGameService.js')).gameService.snapshot.teams[0];
      return [team.progress, team.crewRemaining];
    })).toEqual([1, 6]);
    await host.getByRole('button', { name: 'Next question', exact: true }).click();
    await host.getByRole('button', { name: 'Show question', exact: true }).click();
    await phone.getByRole('button', { name: 'B Indian Ocean' }).click();
    await host.getByRole('button', { name: 'Lock answers', exact: true }).click();
    await host.getByRole('button', { name: 'Reveal correct answer', exact: true }).click();
    await expect(phone.getByRole('heading', { name: 'Wrong!' })).toBeVisible();
    await expect(screen.locator('.is-correct')).toContainText('Pacific Ocean');
    await host.getByRole('button', { name: 'Process round', exact: true }).click();
    await expect(phone.getByText('5 pirates aboard', { exact: false })).toBeVisible();
    await expect(phone.getByText('Crew Remaining: 5', { exact: true })).toBeVisible();
    await expect.poll(() => host.evaluate(async () => {
      const team = (await import('/src/services/SocketGameService.js')).gameService.snapshot.teams[0];
      return [team.progress, team.crewRemaining];
    })).toEqual([1, 5]);
    await card.getByRole('button', { name: 'Regenerate Join Code' }).click();
    await host.getByRole('button', { name: 'Regenerate code', exact: true }).click();
    await expect(phone.getByRole('heading', { name: 'Invalid or expired team code.' })).toBeVisible();
    await expect(card.getByText('Disconnected', { exact: false })).toBeVisible();
    await phone.goto(joinUrl);
    await expect(phone.getByRole('heading', { name: 'Invalid or expired team code.' })).toBeVisible();
    await host.screenshot({ path: 'artifacts/admin-qr-lan.png', fullPage: true });
    // Server files must not be retrievable through the development HTTP server.
    const response = await phone.request.get(`${origin}/server/demoGame.js`);
    expect(response.status()).toBe(403);
    expect(errors).toEqual([]);
  } finally { await hostContext.close(); await phoneContext.close(); await screenContext.close(); }
});

test('localhost never renders a phone QR and invalid codes show a clean error', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: /Load demo game/ }).click();
  await expect(page.getByText('Phone QR unavailable on localhost.', { exact: false })).toHaveCount(4);
  await expect(page.locator('.qr-button')).toHaveCount(0);
  await page.goto('/join/not-a-team');
  await expect(page.getByRole('heading', { name: 'Invalid or expired team code.' })).toBeVisible();
});

import { test, expect } from '@playwright/test';
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (!['http:', 'https:'].includes(location.protocol)) return;
    if (!localStorage.getItem('treasure-tide:language:v1')) localStorage.setItem('treasure-tide:language:v1', 'en');
  });
});

import { createDemoGame } from '../../server/demoGame.js';
async function seed(page, { teams = 2, questions = 3, crews = [2, 6] } = {}) {
  await page.goto('/admin');
  await expect(page.getByText('Server Connected', { exact: true })).toBeVisible();
  const demo = createDemoGame();
  demo.teams = Array.from({ length: teams }, (_, i) => ({ ...demo.teams[i % 4], name: `Crew ${i + 1}`, id: `crew-${i + 1}`, crewInitial: crews[i % crews.length] }));
  demo.questions = demo.questions.slice(0, questions);
  await page.evaluate(async demo => {
    const { gameService } = await import('/src/services/SocketGameService.js');
    await gameService.dispatch({ type: 'RESET_GAME' });
    await gameService.dispatch({ type: 'CREATE_GAME' });
    for (const team of demo.teams) await gameService.dispatch({ type: 'SAVE_TEAM', payload: team });
    for (const q of demo.questions) await gameService.dispatch({ type: 'SAVE_QUESTION', payload: q });
  }, demo);
}
async function state(page) { return page.evaluate(async () => (await import('/src/services/SocketGameService.js')).gameService.snapshot); }
async function teamPath(host, index) { return '/team/' + (await state(host)).teams[index].joinToken; }
async function processRound(host) {
  await host.getByRole('button', { name: 'Lock answers', exact: true }).click();
  await host.getByRole('button', { name: 'Reveal correct answer', exact: true }).click();
  await host.getByRole('button', { name: 'Process round', exact: true }).click();
}
test('host editors create, edit, reorder, validate, reset and remove real game data', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('at least one team');
  await page.getByRole('button', { name: 'Dismiss error' }).click();
  await page.getByRole('button', { name: 'Add team', exact: true }).click();
  await page.getByLabel('Team name', { exact: true }).fill('Test Pirates');
  await page.getByLabel('Starting crew').fill('3');
  await page.getByRole('dialog').getByRole('button', { name: 'Add team', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test Pirates' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Team name', { exact: true }).fill('Edited Pirates');
  await page.getByRole('button', { name: 'Save team', exact: true }).click();
  await page.getByRole('button', { name: /Question chest/ }).click();
  for (const text of ['First question?', 'Second question?']) {
    await page.getByRole('button', { name: 'Add question', exact: true }).click();
    await page.getByRole('textbox', { name: 'Question', exact: true }).fill(text);
    for (const label of ['A', 'B', 'C', 'D']) await page.getByLabel(`Answer ${label}`, { exact: true }).fill(`Option ${label}`);
    await page.getByLabel('Mark B correct').check();
    await page.getByRole('dialog').getByRole('button', { name: 'Add question', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Move question 2 up', exact: true }).click();
  await expect.poll(async () => (await state(page)).questions[0].text).toBe('Second question?');
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Question', exact: true }).fill('Updated question?');
  await page.getByRole('button', { name: 'Save question', exact: true }).click();
  await page.getByRole('button', { name: 'Delete question 2', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect.poll(async () => (await state(page)).questions.length).toBe(1);
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.getByRole('button', { name: 'Reset game', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByRole('button', { name: /Fleet & crew/ }).click();
  await page.getByRole('button', { name: 'Delete Edited Pirates', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect.poll(async () => (await state(page)).teams.length).toBe(0);
  expect(errors).toEqual([]);
});

test('two teams complete a synchronized voyage, reload, sink, finish and restart', async ({ page: host, context }) => {
  const errors = []; context.on('page', p => p.on('pageerror', e => errors.push(e.message))); host.on('pageerror', e => errors.push(e.message));
  await seed(host);
  const screen = await context.newPage(); await screen.setViewportSize({ width: 1920, height: 1080 }); await screen.goto('/game');
  const team1 = await context.newPage(); await team1.setViewportSize({ width: 390, height: 844 }); await team1.goto(await teamPath(host, 0));
  const team2 = await context.newPage(); await team2.goto(await teamPath(host, 1));
  await host.getByRole('button', { name: 'Start game', exact: true }).click();
  await host.getByRole('button', { name: 'Show question', exact: true }).click();
  await expect(team1.getByRole('button', { name: 'A Atlantic Ocean' })).toBeVisible();
  await host.getByRole('button', { name: 'Pause game', exact: true }).click();
  await expect(team1.getByRole('heading', { name: 'Anchors down.' })).toBeVisible();
  await host.getByRole('button', { name: 'Resume game', exact: true }).click();
  await Promise.all([team1.getByRole('button', { name: 'A Atlantic Ocean' }).click(), team2.getByRole('button', { name: 'C Pacific Ocean' }).click()]);
  await expect(team1.getByRole('heading', { name: 'Answer Submitted' })).toBeVisible();
  expect(Object.keys((await state(host)).answers)).toHaveLength(2);
  await team1.reload(); await expect(team1.getByRole('heading', { name: 'Answer Submitted' })).toBeVisible();
  await expect(team1.locator('.team-answer:disabled')).toHaveCount(4);
  await processRound(host);
  await expect(host.getByRole('button', { name: 'Next question', exact: true })).toBeDisabled();
  await expect(screen.locator('[data-crew="falling"]')).toHaveCount(1);
  await expect(screen.locator('.race-lane').first().locator('[data-crew="aboard"]')).toHaveCount(1);
  await screen.screenshot({ path: 'artifacts/game-round.png' });
  await expect(host.getByRole('button', { name: 'Next question', exact: true })).toBeEnabled();
  expect((await state(host)).teams.map(t => [t.crewRemaining, t.progress])).toEqual([[1, 0], [6, 1]]);
  await host.getByRole('button', { name: 'Next question', exact: true }).click();
  await host.getByRole('button', { name: 'Show question', exact: true }).click();
  await Promise.all([team1.getByRole('button', { name: 'B An anchor' }).click(), team2.getByRole('button', { name: 'A A compass' }).click()]);
  await processRound(host);
  await expect(screen.locator('.sinking')).toHaveCount(1);
  await expect(team1.getByRole('heading', { name: 'A brave voyage, mateys.' })).toBeVisible();
  await team1.reload();
  await expect(team1.getByRole('heading', { name: 'A brave voyage, mateys.' })).toBeVisible();
  await host.reload();
  await expect(host.getByRole('button', { name: 'Next question', exact: true })).toBeEnabled();
  await host.getByRole('button', { name: 'Next question', exact: true }).click();
  await host.getByRole('button', { name: 'Show question', exact: true }).click();
  await team2.getByRole('button', { name: 'C Three' }).click(); await processRound(host);
  await expect(screen.getByRole('heading', { name: 'A legendary voyage.' })).toBeVisible({ timeout: 15000 });
  await team2.reload();
  await expect(team2.getByRole('heading', { name: 'The voyage is complete!' })).toBeVisible();
  await expect(team2.locator('.team-answer:not(:disabled)')).toHaveCount(0);
  expect((await state(host)).rankings[0].id).toBe('crew-2');
  await screen.screenshot({ path: 'artifacts/results.png' });
  await host.getByRole('button', { name: 'Restart game', exact: true }).click(); await host.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(host.getByRole('button', { name: 'Start game', exact: true })).toBeVisible();
  expect((await state(host)).teams.map(t => t.crewRemaining)).toEqual([2, 6]);
  expect(errors).toEqual([]);
});

test('six crews submit concurrently, share tied finishes, and render at desktop and mobile sizes', async ({ page, context }) => {
  await seed(page, { teams: 6, questions: 1, crews: [2, 3, 4, 5, 6, 6] });
  const screen = await context.newPage(); await screen.setViewportSize({ width: 1920, height: 1080 }); await screen.goto('/game');
  await expect(screen.locator('.race-lane')).toHaveCount(6);
  await expect(screen.locator('[data-crew="aboard"]')).toHaveCount(26);
  await screen.screenshot({ path: 'artifacts/six-ships.png', animations: 'disabled' });
  const plates = await screen.locator('.ship-nameplate').evaluateAll(elements => elements.map(e => ({ top: e.getBoundingClientRect().top, bottom: e.getBoundingClientRect().bottom })));
  for (let i = 1; i < plates.length; i++) expect(plates[i].top).toBeGreaterThan(plates[i - 1].bottom);
  await page.getByRole('button', { name: 'Start game', exact: true }).click(); await page.getByRole('button', { name: 'Show question', exact: true }).click();
  const devices = await Promise.all(Array.from({ length: 6 }, async (_, i) => { const p = await context.newPage(); await p.setViewportSize({ width: 390, height: 844 }); await p.goto(await teamPath(page, i)); return p; }));
  await devices[0].screenshot({ path: 'artifacts/team-mobile.png' });
  expect(await devices[0].evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await Promise.all(devices.map(p => p.getByRole('button', { name: 'C Pacific Ocean' }).click()));
  expect(Object.keys((await state(page)).answers)).toHaveLength(6);
  await processRound(page);
  await expect(screen.getByRole('heading', { name: 'A legendary voyage.' })).toBeVisible({ timeout: 15000 });
  expect((await state(page)).rankings.map(t => t.finalRank)).toEqual([1, 1, 3, 4, 5, 6]);
});

test('many teams paginate and early end, empty results, invalid team and demo load work', async ({ page }) => {
  await page.goto('/admin'); await expect(page.getByText('Server Connected', { exact: true })).toBeVisible(); await page.goto('/results'); await expect(page.getByRole('heading', { name: 'The treasure is still ahead.' })).toBeVisible();
  await page.goto('/team/unknown'); await expect(page.getByRole('heading', { name: 'Invalid or expired team code.' })).toBeVisible();
  await page.goto('/admin'); await page.getByRole('button', { name: /Load demo game/ }).click();
  await expect(page.getByRole('heading', { name: 'Black Sharks' })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1080 }); await page.evaluate(() => window.scrollTo(0, 0));
  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toContain('\uFFFD');
  expect(visibleText).not.toContain(String.fromCharCode(0));
  await page.screenshot({ path: 'artifacts/admin.png', fullPage: true });
  await page.goto('/'); await page.screenshot({ path: 'artifacts/harbor.png', fullPage: true });
  await seed(page, { teams: 18 }); await page.goto('/game');
  await expect(page.getByText('Fleet 1 / 3', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Next fleet group' }).click();
  await expect(page.getByText('Fleet 2 / 3', { exact: false })).toBeVisible();
  await page.goto('/admin'); await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.getByRole('button', { name: 'End game', exact: true }).click(); await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  expect((await state(page)).phase).toBe('GAME_FINISHED');
});

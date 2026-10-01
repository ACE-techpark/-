import { test, expect } from '@playwright/test';
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (!['http:', 'https:'].includes(location.protocol)) return;
    if (!localStorage.getItem('treasure-tide:language:v1')) localStorage.setItem('treasure-tide:language:v1', 'en');
  });
});

const dispatch = (page, type, payload) => page.evaluate(async ({ type, payload }) => {
  const { gameService } = await import('/src/services/SocketGameService.js');
  await gameService.dispatch({ type, payload });
}, { type, payload });
const state = page => page.evaluate(async () => (await import('/src/services/SocketGameService.js')).gameService.snapshot);

test('question upload, validation, replace/remove, persistence, phone display and island celebration work together', async ({ page, context }) => {
  const errors = [];
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
  watch(page);
  await page.goto('/admin');
  await expect(page.getByText('Server Connected', { exact: true })).toBeVisible();
  await dispatch(page, 'SAVE_TEAM', { id: 'test-crew', name: 'Island explorers', crewInitial: 3, shipColor: '#62b9ff' });
  await page.getByRole('button', { name: /Question chest/ }).click();
  await page.getByRole('button', { name: 'Add question', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Question', exact: true }).fill('What color is this island map?');
  for (const [i, answer] of ['Blue', 'Red', 'Green', 'Gold'].entries()) await dialog.getByLabel(`Answer ${'ABCD'[i]}`, { exact: true }).fill(answer);
  await dialog.getByLabel('Mark A correct').check();
  const upload = dialog.locator('input[type=file]');
  await upload.setInputFiles({ name: 'text.txt', mimeType: 'text/plain', buffer: Buffer.from('no image') });
  await expect(dialog.getByRole('alert')).toContainText('PNG');
  await upload.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
  await expect(dialog.getByRole('alert')).toContainText('4 MB');
  await upload.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken image') });
  await expect(dialog.getByRole('alert')).toContainText('could not be opened');
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 320;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#64bed6'; ctx.fillRect(0, 0, 640, 320);
    ctx.fillStyle = '#ffe5a2'; ctx.beginPath(); ctx.ellipse(320, 190, 140, 65, -.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c635c'; ctx.font = 'bold 36px sans-serif'; ctx.fillText('Treasure map', 190, 110);
    return canvas.toDataURL().split(',')[1];
  });
  const file = { name: 'map.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
  await upload.setInputFiles(file);
  await expect(dialog.locator('.question-image')).toBeVisible();
  await dialog.getByRole('button', { name: 'Remove image' }).click();
  await expect(dialog.locator('.question-image')).toHaveCount(0);
  await upload.setInputFiles(file);
  await expect(dialog.locator('.question-image')).toBeVisible();
  await dialog.getByLabel('Image description').fill('Blue sea with a sandy island');
  await dialog.getByRole('button', { name: 'Add question', exact: true }).click();
  const saved = await state(page);
  expect(saved.questions[0].imageUrl).toMatch(/^data:image\/webp;base64,/);
  await page.reload();
  await page.getByRole('button', { name: /Question chest/ }).click();
  await expect(page.locator('.question-image')).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(dialog.getByLabel('Image description')).toHaveValue('Blue sea with a sandy island');
  await dialog.getByLabel('Replace image').setInputFiles(file);
  await expect(dialog.getByRole('button', { name: 'Save question' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save question' }).click();
  const screen = await context.newPage(); watch(screen);
  await screen.setViewportSize({ width: 1440, height: 1000 });
  await screen.goto(`/game?gameId=${saved.gameId}`);
  const phone = await context.newPage(); watch(phone);
  await phone.setViewportSize({ width: 390, height: 844 });
  await phone.goto(`/team/${saved.teams[0].joinToken}`);
  await dispatch(page, 'START_GAME'); await dispatch(page, 'SHOW_QUESTION');
  for (const device of [screen, phone]) {
    const img = device.getByRole('img', { name: 'Blue sea with a sandy island' });
    await expect(img).toBeVisible();
    expect(await img.evaluate(el => el.complete && el.naturalWidth === 640)).toBe(true);
    expect(await device.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await screen.screenshot({ path: 'artifacts/question-image-game.png' });
  await phone.screenshot({ path: 'artifacts/question-image-phone.png' });
  await expect(screen.locator('.dolphin')).toHaveCount(2);
  await expect.poll(() => screen.locator('.dolphin-leap').first().evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 20000 }).toBeGreaterThan(.5);
  await phone.getByRole('button', { name: 'A Blue' }).click();
  await dispatch(page, 'LOCK_ANSWERS'); await dispatch(page, 'REVEAL_ANSWER'); await dispatch(page, 'PROCESS_ROUND');
  await expect(screen.locator('.wind-effect')).toHaveCount(1);
  await expect.poll(() => screen.locator('.wind-effect').evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.3);
  const ranked = (await state(page)).rankings;
  expect(ranked[0].status).toBe('FINISHED'); expect(ranked[0].finalRank).toBe(1);
  await expect(screen.locator('[data-crew="ashore"]')).toHaveCount(3);
  await expect(screen.locator('[data-crew="aboard"]')).toHaveCount(0);
  await expect.poll(() => screen.locator('.treasure-glow').last().evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 8000 }).toBeGreaterThan(.4);
  await dispatch(page, 'PAUSE_GAME');
  await expect(screen.locator('.world-paused')).toHaveCount(1);
  expect(await screen.locator('.chest-lid').last().evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  expect(await screen.locator('.wind-effect').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(0);
  await screen.locator('.pause-overlay').evaluate(el => el.style.visibility = 'hidden');
  await screen.screenshot({ path: 'artifacts/island-arrival.png' });
  await dispatch(page, 'RESUME_GAME');
  await expect(screen.getByRole('heading', { name: 'A legendary voyage.' })).toBeVisible({ timeout: 10000 });
  expect((await state(page)).rankings).toEqual(ranked);
  expect(errors).toEqual([]);
});

test('arrival renders only one or three survivors, pauses movement, and keeps effects bounded', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { default: OceanScene } = await import('/src/components/game/OceanScene.jsx');
    const { createInitialState } = await import('/src/logic/gameEngine.js');
    const game = createInitialState();
    Object.assign(game, { phase: 'ROUND_ANIMATION', animationEndsAt: Date.now() + 7200, questions: [{ id: 'q' }],
      teams: [1, 3, 0].map((crewRemaining, i) => ({ id: `crew-${i}`, name: `Survivors ${crewRemaining}`, crewInitial: 6, crewRemaining, progress: i < 2 ? 1 : 0, status: i < 2 ? 'FINISHED' : 'ELIMINATED', shipColor: '#ffce61' })) });
    game.roundResults = game.teams.map(t => ({ teamId: t.id, finished: t.status === 'FINISHED', correct: t.status === 'FINISHED', previousProgress: 0, progress: t.progress }));
    const container = document.createElement('div'); container.id = 'scene-test'; container.style.cssText = 'position:fixed;inset:0;display:flex;z-index:1000'; document.body.append(container);
    window.sceneRoot = ReactDOM.createRoot(container); window.sceneGame = game; window.Scene = OceanScene; window.sceneReact = React;
    window.sceneRoot.render(React.createElement(OceanScene, { game }));
  });
  await expect(page.locator('#scene-test [data-team-id="crew-0"] [data-crew="ashore"]')).toHaveCount(1);
  await expect(page.locator('#scene-test [data-team-id="crew-1"] [data-crew="ashore"]')).toHaveCount(3);
  await expect(page.locator('#scene-test .island-finish-scene')).toHaveCount(2);
  const samples = await page.evaluate(async () => {
    const frames = []; let previous = performance.now();
    await new Promise(resolve => { const frame = now => { frames.push(now - previous); previous = now; if (frames.length < 40) requestAnimationFrame(frame); else resolve(); }; requestAnimationFrame(frame); });
    return frames.slice(1).sort((a, b) => a - b);
  });
  expect(samples[Math.floor(samples.length / 2)]).toBeLessThan(100);
  await test.info().attach('active-animation-frame-times.json', { body: JSON.stringify(samples), contentType: 'application/json' });
  await page.evaluate(() => window.sceneRoot.render(window.sceneReact.createElement(window.Scene, { game: { ...window.sceneGame, phase: 'PAUSED', pausedPhase: 'ROUND_ANIMATION', animationRemaining: 6500 } })));
  await expect(page.locator('#scene-test .world-paused')).toHaveCount(1);
  const position = await page.locator('#scene-test .ship-moving').first().evaluate(el => el.getBoundingClientRect().left);
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 150)));
  expect(await page.locator('#scene-test .ship-moving').first().evaluate(el => el.getBoundingClientRect().left)).toBe(position);
  await expect(page.locator('#scene-test .dolphin')).toHaveCount(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#scene-test .dolphin-manager')).toBeHidden();
});

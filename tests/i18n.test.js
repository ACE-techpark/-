import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dictionaries, translate, translateError, questionContent, DEFAULT_LANGUAGE } from '../src/i18n/i18n.js';
import { createInitialState, reduceGame } from '../src/logic/gameEngine.js';
import { GameRooms } from '../server/gameRooms.js';
import { createDemoGame } from '../server/demoGame.js';
import { validateQuestionTranslations } from '../src/utils/questionTranslations.js';

test('both catalogs have the same keys and interpolation variables, with Georgian as default', () => {
  assert.equal(DEFAULT_LANGUAGE, 'ka');
  assert.deepEqual(Object.keys(dictionaries.ka).sort(), Object.keys(dictionaries.en).sort());
  for (const [key, value] of Object.entries(dictionaries.en)) {
    assert.ok(dictionaries.ka[key], key);
    const params = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    assert.deepEqual(params(dictionaries.ka[key]), params(value), key);
  }
  assert.equal(translate('common.crewCount', { count: 5 }), 'ეკიპაჟი: 5');
  assert.equal(translate('common.crewCount', { count: 5 }, 'en'), '5 crew');
  assert.equal(translate('join.as', { name: '<b>ქართული გუნდი</b>' }), 'გუნდთან შეერთება: <b>ქართული გუნდი</b>');
});

test('static translation calls reference existing keys; canonical application errors all have translations', () => {
  const uiFiles = readdirSync('src/components', { recursive: true }).filter(f => f.endsWith('.jsx')).map(f => `src/components/${f}`);
  for (const file of [...uiFiles, 'src/app/App.jsx']) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(['"]([^'"]+)['"]/g)) assert.ok(dictionaries.en[match[1]], `${file}: ${match[1]}`);
  }
  for (const file of ['src/utils/validation.js', 'src/utils/questionImage.js', 'src/utils/questionTranslations.js', 'src/logic/gameEngine.js', 'src/services/SocketGameService.js', 'src/config/networkConfig.js', 'server/gameRooms.js', 'server/socketHandlers.js']) {
    for (const match of readFileSync(file, 'utf8').matchAll(/new Error\('([^']+)'\)/g)) {
      assert.notEqual(translateError(match[1]), dictionaries.ka['error.unexpected'], `${file}: ${match[1]}`);
      assert.equal(translateError(match[1], 'en'), match[1]);
    }
  }
  assert.match(translateError('Starting crew must be 2–6 pirates.'), /2–6/);
  assert.match(translateError('Fill in all 4 answer choices.'), /4/);
});

test('host content stays literal; only explicitly provided question translations are selected', () => {
  for (const text of ['Start game', 'საქართველოს დედაქალაქი რომელია?', 'What is the capital of Georgia?']) {
    assert.equal(questionContent({ text }, 'text', 'ka'), text);
    assert.equal(questionContent({ text }, 'text', 'en'), text);
  }
  const question = { text: 'Original', translations: { ka: { text: 'ქართული კითხვა' } } };
  assert.equal(questionContent(question, 'text', 'ka'), 'ქართული კითხვა');
  assert.equal(questionContent(question, 'text', 'en'), 'Original');
  assert.doesNotThrow(() => validateQuestionTranslations(question));
  assert.throws(() => validateQuestionTranslations({ translations: { ka: { correctAnswerId: 'secret' } } }));
  assert.throws(() => validateQuestionTranslations({ translations: { ka: { text: 123 } } }));
});

test('generated game titles have a translation key; explicit host names never do', () => {
  const initial = createInitialState();
  assert.equal(initial.nameKey, 'game.defaultName');
  const saved = reduceGame(initial, { type: 'SAVE_GAME', payload: { name: 'The Great Treasure Race', description: '' } });
  assert.equal(saved.nameKey, null);
  assert.equal(reduceGame(saved, { type: 'RESET_GAME' }).nameKey, null);
  assert.equal(reduceGame(initial, { type: 'LOAD_DEMO', payload: createDemoGame() }).nameKey, null);
});

test('explicit translations survive serialization and public snapshots without leaking answer keys', () => {
  const rooms = new GameRooms(); const room = rooms.create('c'.repeat(64));
  rooms.command(room, { type: 'LOAD_DEMO', payload: createDemoGame() });
  const q = structuredClone(room.state.questions[0]);
  q.translations = { ka: { text: 'რომელია ყველაზე დიდი ოკეანე?' } };
  q.answers[0].translations = { ka: { text: 'პასუხის თარგმანი' } };
  rooms.command(room, { type: 'SAVE_QUESTION', payload: q });
  rooms.command(room, { type: 'START_GAME' }); rooms.command(room, { type: 'SHOW_QUESTION' });
  const snapshot = JSON.parse(JSON.stringify(rooms.snapshot(room, 'public')));
  assert.equal(snapshot.questions[0].translations.ka.text, q.translations.ka.text);
  assert.equal(snapshot.questions[0].answers[0].translations.ka.text, 'პასუხის თარგმანი');
  assert.equal(snapshot.questions[0].correctAnswerId, undefined);
  assert.equal(snapshot.questions[1].text, undefined);
});

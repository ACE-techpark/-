import { defaultGameSettings, PHASE } from '../data/defaultGameSettings.js';
import { validateGame, validateTeam, validateQuestion } from '../utils/validation.js';
import { calculateRoundResults } from './roundEngine.js';
import { rankTeams } from './rankingEngine.js';
import { roundPresentationMs } from './presentationTiming.js';

const freshTeam = t => ({ ...t, crewRemaining: t.crewInitial, progress: 0, status: 'ACTIVE',
  currentAnswer: null, answeredCorrectly: null, finishRound: null, finalRank: null });
export function createInitialState() {
  return { schemaVersion: 1, revision: 0, name: 'The Great Treasure Race', nameKey: 'game.defaultName', description: '',
    settings: { ...defaultGameSettings }, teams: [], questions: [], phase: PHASE.SETUP,
    questionIndex: 0, answers: {}, roundResults: [], rankings: [], animationEndsAt: null, pausedPhase: null };
}
const requirePhase = (state, phases) => {
  if (!phases.includes(state.phase)) throw new Error('That action is unavailable in the current game phase.');
};
export function reduceGame(state, command, now = Date.now()) {
  const { type, payload = {} } = command;
  let next = { ...state };
  if (['SAVE_GAME', 'SAVE_TEAM', 'REMOVE_TEAM', 'SAVE_QUESTION', 'REMOVE_QUESTION', 'REORDER_QUESTION', 'CREATE_GAME', 'LOAD_DEMO'].includes(type))
    requirePhase(state, [PHASE.SETUP, PHASE.LOBBY]);
  switch (type) {
    case 'CREATE_GAME': next = { ...createInitialState(), name: payload.name || 'Untitled voyage', nameKey: payload.name ? null : 'game.untitledName', description: payload.description || '' }; break;
    case 'SAVE_GAME': next = { ...state, name: payload.name, nameKey: null, description: payload.description }; break;
    case 'LOAD_DEMO': next = { ...createInitialState(), ...payload, nameKey: null, teams: payload.teams.map(freshTeam) }; break;
    case 'SAVE_TEAM': {
      validateTeam(payload, state.settings);
      const team = freshTeam(payload);
      next.teams = state.teams.some(t => t.id === team.id) ? state.teams.map(t => t.id === team.id ? team : t) : [...state.teams, team]; break;
    }
    case 'REMOVE_TEAM': next.teams = state.teams.filter(t => t.id !== payload.id); break;
    case 'SAVE_QUESTION':
      validateQuestion(payload, state.settings);
      next.questions = state.questions.some(q => q.id === payload.id) ? state.questions.map(q => q.id === payload.id ? payload : q) : [...state.questions, payload]; break;
    case 'REMOVE_QUESTION': next.questions = state.questions.filter(q => q.id !== payload.id); break;
    case 'REORDER_QUESTION': {
      const index = state.questions.findIndex(q => q.id === payload.id);
      const target = index + payload.direction;
      if (index < 0 || target < 0 || target >= state.questions.length) throw new Error('Question cannot move farther.');
      next.questions = [...state.questions];
      [next.questions[index], next.questions[target]] = [next.questions[target], next.questions[index]]; break;
    }
    case 'RESET_GAME': next = { ...createInitialState(), name: state.name, nameKey: state.nameKey ?? null, description: state.description,
      settings: state.settings, questions: state.questions, teams: state.teams.map(freshTeam) }; break;
    case 'START_GAME':
      requirePhase(state, [PHASE.SETUP, PHASE.LOBBY]); validateGame(state);
      next = { ...state, phase: PHASE.READY, teams: state.teams.map(freshTeam), questionIndex: 0, answers: {}, roundResults: [] }; break;
    case 'SHOW_QUESTION': requirePhase(state, [PHASE.READY]); next.phase = PHASE.QUESTION_ACTIVE; break;
    case 'SUBMIT_ANSWER': {
      requirePhase(state, [PHASE.QUESTION_ACTIVE]);
      if (payload.questionId !== state.questions[state.questionIndex].id) throw new Error('This question has ended.');
      if (state.teams.find(t => t.id === payload.teamId)?.status !== 'ACTIVE') throw new Error('This ship cannot answer.');
      if (Object.hasOwn(state.answers, payload.teamId)) throw new Error('Your answer is already locked in.');
      if (!state.questions[state.questionIndex].answers.some(a => a.id === payload.answerId)) throw new Error('Invalid answer.');
      next.answers = { ...state.answers, [payload.teamId]: payload.answerId }; break;
    }
    case 'LOCK_ANSWERS': requirePhase(state, [PHASE.QUESTION_ACTIVE]); next.phase = PHASE.ANSWERS_LOCKED; break;
    case 'REVEAL_ANSWER': requirePhase(state, [PHASE.ANSWERS_LOCKED]); next.phase = PHASE.ANSWER_REVEAL; break;
    case 'PROCESS_ROUND':
      requirePhase(state, [PHASE.ANSWER_REVEAL]);
      next = { ...state, ...calculateRoundResults(state), phase: PHASE.ROUND_ANIMATION };
      next.animationEndsAt = now + roundPresentationMs(next.roundResults, state.settings); break;
    case 'COMPLETE_ROUND':
      requirePhase(state, [PHASE.ROUND_ANIMATION]);
      if (now < state.animationEndsAt) throw new Error('The round presentation is still playing.');
      next.phase = state.questionIndex >= state.questions.length - 1 || state.teams.every(t => t.status !== 'ACTIVE') ? PHASE.GAME_FINISHED : PHASE.NEXT_ROUND;
      next.animationEndsAt = null; break;
    case 'NEXT_QUESTION':
      requirePhase(state, [PHASE.NEXT_ROUND]);
      next = { ...state, questionIndex: state.questionIndex + 1, phase: PHASE.READY, answers: {}, roundResults: [],
        teams: state.teams.map(t => ({ ...t, currentAnswer: null, answeredCorrectly: null })) }; break;
    case 'PAUSE_GAME':
      requirePhase(state, [PHASE.READY, PHASE.QUESTION_ACTIVE, PHASE.ANSWERS_LOCKED, PHASE.ANSWER_REVEAL, PHASE.ROUND_ANIMATION, PHASE.NEXT_ROUND]);
      next = { ...state, phase: PHASE.PAUSED, pausedPhase: state.phase, animationRemaining: Math.max(0, (state.animationEndsAt || now) - now) }; break;
    case 'RESUME_GAME':
      requirePhase(state, [PHASE.PAUSED]);
      next = { ...state, phase: state.pausedPhase, pausedPhase: null, animationEndsAt: state.pausedPhase === PHASE.ROUND_ANIMATION ? now + state.animationRemaining : null }; break;
    case 'END_GAME':
      requirePhase(state, Object.values(PHASE).filter(p => ![PHASE.SETUP, PHASE.LOBBY, PHASE.GAME_FINISHED].includes(p)));
      next.phase = PHASE.GAME_FINISHED; next.animationEndsAt = null; break;
    default: throw new Error(`Unknown game action: ${type}`);
  }
  next.rankings = rankTeams(next.teams);
  return { ...next, revision: state.revision + 1 };
}

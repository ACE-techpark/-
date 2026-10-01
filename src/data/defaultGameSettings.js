export const defaultGameSettings = Object.freeze({
  minCrewSize: 2, maxCrewSize: 6, correctAnswerMovement: 1,
  wrongAnswerMovement: 0, crewLossOnWrongAnswer: 1,
  allowSingleCrewContinuation: true, eliminateAtZeroCrew: true,
  answersPerQuestion: 4, movementMode: 'correct-only',
  rankingMode: 'arrival-then-crew', animationDurationMs: 3400,
});
export const PHASE = Object.freeze({ SETUP: 'SETUP', LOBBY: 'LOBBY', READY: 'READY',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE', ANSWERS_LOCKED: 'ANSWERS_LOCKED',
  ANSWER_REVEAL: 'ANSWER_REVEAL', ROUND_ANIMATION: 'ROUND_ANIMATION',
  NEXT_ROUND: 'NEXT_ROUND', PAUSED: 'PAUSED', GAME_FINISHED: 'GAME_FINISHED' });
export const SHIP_COLORS = ['#ff745f', '#62b9ff', '#b098ff', '#ffce61', '#51d4b3', '#f293c8'];
export const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

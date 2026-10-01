import { raceDistance } from './movementRules.js';
export function calculateRoundResults(state) {
  const question = state.questions[state.questionIndex];
  const distance = raceDistance(state.questions.length, state.settings);
  const results = [];
  const teams = state.teams.map(team => {
    if (team.status !== 'ACTIVE') return team;
    const answer = state.answers[team.id];
    const correct = answer === question.correctAnswerId;
    const crewLost = correct ? 0 : Math.min(team.crewRemaining, state.settings.crewLossOnWrongAnswer);
    const crewRemaining = team.crewRemaining - crewLost;
    const progress = Math.min(distance, team.progress + (correct ? state.settings.correctAnswerMovement : state.settings.wrongAnswerMovement));
    const status = crewRemaining === 0 ? 'ELIMINATED' : progress >= distance ? 'FINISHED' : 'ACTIVE';
    results.push({ teamId: team.id, correct, missed: !answer, crewLost, previousCrew: team.crewRemaining,
      previousProgress: team.progress, progress, eliminated: status === 'ELIMINATED', finished: status === 'FINISHED' });
    return { ...team, crewRemaining, progress, status, answeredCorrectly: correct,
      currentAnswer: answer ?? null, finishRound: status === 'FINISHED' ? state.questionIndex + 1 : null };
  });
  return { teams, roundResults: results };
}

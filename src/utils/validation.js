import { validateQuestionImage } from './questionImage.js';
import { validateQuestionTranslations } from './questionTranslations.js';
export function validateTeam(team, settings) {
  if (!team.name?.trim()) throw new Error('Give your team a name.');
  if (!Number.isInteger(team.crewInitial) || team.crewInitial < settings.minCrewSize || team.crewInitial > settings.maxCrewSize)
    throw new Error(`Starting crew must be ${settings.minCrewSize}–${settings.maxCrewSize} pirates.`);
  if (!/^#[0-9a-f]{6}$/i.test(team.shipColor)) throw new Error('Choose a valid ship color.');
}
export function validateQuestion(question, settings) {
  validateQuestionImage(question);
  validateQuestionTranslations(question);
  if (!question.text?.trim()) throw new Error('Enter the question text.');
  if (question.answers?.length !== settings.answersPerQuestion || question.answers.some(a => !a.text?.trim()))
    throw new Error(`Fill in all ${settings.answersPerQuestion} answer choices.`);
  question.answers.forEach(validateQuestionTranslations);
  if (new Set(question.answers.map(a => a.id)).size !== question.answers.length) throw new Error('Answer IDs must be unique.');
  if (!question.answers.some(a => a.id === question.correctAnswerId)) throw new Error('Select the correct answer.');
}
export function validateGame(state) {
  if (!state.name.trim()) throw new Error('Give your voyage a name.');
  if (!state.teams.length) throw new Error('Add at least one team before setting sail.');
  if (!state.questions.length) throw new Error('Add at least one question before setting sail.');
  state.teams.forEach(t => validateTeam(t, state.settings));
  state.questions.forEach(q => validateQuestion(q, state.settings));
}

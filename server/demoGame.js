import { SHIP_COLORS } from '../src/data/defaultGameSettings.js';
const questions = [
  ['Which ocean is the largest on Earth?', 'Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean', 2],
  ['What do sailors use to find north?', 'A compass', 'An anchor', 'A telescope', 'A paddle', 0],
  ['How many hearts does an octopus have?', 'One', 'Two', 'Three', 'Four', 2],
  ['Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 1],
  ['What is the chemical formula for water?', 'CO2', 'NaCl', 'O2', 'H2O', 3],
  ['Which animal is a mammal?', 'Shark', 'Dolphin', 'Octopus', 'Seahorse', 1],
  ['How many sides does a hexagon have?', 'Five', 'Six', 'Seven', 'Eight', 1],
  ['What is the largest living animal?', 'Blue whale', 'Elephant', 'Giraffe', 'Whale shark', 0],
  ['Which direction is opposite to east?', 'North', 'South', 'West', 'Northeast', 2],
  ['What does a ship drop to stay in place?', 'Its sail', 'Its flag', 'Its compass', 'Its anchor', 3],
];
export function createDemoGame() {
  return { name: 'The Great Treasure Race', description: 'A little knowledge. A lot of adventure.',
    teams: ['Black Sharks', 'Sea Wolves', 'Red Kraken', 'Golden Pirates'].map((name, i) =>
      ({ id: `demo-team-${i}`, name, shipColor: SHIP_COLORS[i], crewInitial: 6 })),
    questions: questions.map(([text, ...rest], i) => ({ id: `demo-question-${i}`, type: 'multiple-choice', text,
      answers: rest.slice(0, 4).map((text, j) => ({ id: `answer-${i}-${j}`, text })), correctAnswerId: `answer-${i}-${rest[4]}` })),
  };
}


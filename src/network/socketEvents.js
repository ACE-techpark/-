// Shared protocol: clients request commands; only the server publishes snapshots.
export const EVENTS = Object.freeze({
  HOST_CONNECT: 'host:create-game', HOST_COMMAND: 'host:command',
  TEAM_LOOKUP: 'team:lookup', TEAM_JOIN: 'team:join', TEAM_ANSWER: 'team:submit-answer',
  WATCH: 'game:watch', STATE: 'game:state', REVOKED: 'team:revoked',
});

import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Sessions: a.model({
    content: a.string(),
    score_rating: a.integer(),
    score_volume: a.integer(),
    total_score: a.integer(),
    userId: a.id(),
    start_time: a.datetime(), // Using string for datetime
    end_time: a.datetime(), // Using string for datetime
    duration: a.integer(), // Duration in seconds
    user: a.belongsTo('User', 'userId') // Ensure this reference matches the type used in UserStreak
  }).authorization(allow => [allow.owner()]),

  User: a.model({
    owner: a.string(),
    sessions: a.hasMany('Sessions', 'userId'), // Ensure this reference matches the type used in Sessions
    lastMeditationDate: a.datetime(), // Using string for datetime
    currentStreak: a.integer(),
    longestStreak: a.integer(),
  }).authorization(allow => [allow.owner()])
});

// Used for code completion / highlighting when making requests from frontend
export type Schema = ClientSchema<typeof schema>;

// Defines the data resource to be deployed
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  }
});

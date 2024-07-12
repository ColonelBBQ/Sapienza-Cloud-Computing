import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Sessions: a.model({
    content: a.string(),
    score_rating: a.integer(),
    score_volume: a.integer(),
    total_score: a.float(),
    userId: a.id(),
    start_time: a.datetime(),
    end_time: a.datetime(),
    duration: a.integer(),
    user: a.belongsTo('User', 'userId')
  }).authorization(allow => [allow.owner()]),

  User: a.model({
    id: a.string(),
    sessions: a.hasMany('Sessions', 'userId'),
    lastMeditationDate: a.datetime(),
    currentStreak: a.integer(),
    longestStreak: a.integer(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [
    allow.owner().to(['read'])])
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

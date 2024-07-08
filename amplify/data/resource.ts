import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Sessions: a.model({
    content: a.string(),
    rating: a.integer(),
    
  }).authorization(allow => [allow.owner()]),
});

// Used for code completion / highlighting when making requests from frontend
export type Schema = ClientSchema<typeof schema>;

// defines the data resource to be deployed
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  }
});
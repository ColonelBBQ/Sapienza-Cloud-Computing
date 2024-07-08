import { defineBackend } from "@aws-amplify/backend";
import { data } from './data/resource';
import { auth } from './auth/resource';

const backend = defineBackend({
  data,
  auth,
});

backend.addOutput({
  auth: {
    aws_region: "us-east-1",
    user_pool_id: "us-east-1_5bveIEknd",
    user_pool_client_id: "7u5os7imhpojjjlskh5fd20inn",
    identity_pool_id: "us-east-1:2ab219f5-6df9-4727-8262-ccdbe68940da",
    username_attributes: ["email"],
    standard_required_attributes: ["email", "preferred_username"],
    user_verification_types: ["email"],
    unauthenticated_identities_enabled: true,
    password_policy: {
      min_length: 8,
      require_lowercase: true,
      require_uppercase: true,
      require_numbers: true,
      require_symbols: true,
    }
  }
});
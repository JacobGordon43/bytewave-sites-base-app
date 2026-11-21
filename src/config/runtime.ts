import type { ResourcesConfig } from "aws-amplify";
const generated = __APP_OUTPUTS__;
const poolId = generated.auth?.user_pool_id || import.meta.env.VITE_APP_USER_POOL;
const clientId = generated.auth?.user_pool_client_id || import.meta.env.VITE_APP_USER_POOL_CLIENT_ID;
export const authConfigured = Boolean(poolId && clientId);
export const apiEndpoint = generated.custom?.API?.endpoint || import.meta.env.VITE_APP_API_GATEWAY || "";
export const outputs = generated.auth ? generated : (authConfigured ? {
  Auth: { Cognito: { userPoolId: poolId, userPoolClientId: clientId } },
} satisfies ResourcesConfig : {});

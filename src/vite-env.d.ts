/// <reference types="vite/client" />
declare const __APP_OUTPUTS__: {
  version: "1.4";
  auth?: { aws_region: string; user_pool_id: string; user_pool_client_id: string; identity_pool_id?: string; [key: string]: unknown };
  custom?: { API?: { endpoint?: string } };
};

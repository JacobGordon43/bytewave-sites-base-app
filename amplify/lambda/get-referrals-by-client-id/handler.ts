import { getTableName } from "../shared/environment";
import { createTenantQueryHandler } from "../shared/tenant-query";

export const handler = createTenantQueryHandler({
  operation: "GetReferralsByClientId",
  tableName: getTableName("referrals"),
  indexName: "clientIDIndex",
  pathParameter: "clientId",
  lookupAttribute: "referredBy",
  clientMayQueryOwnLookup: true,
});

import { getTableName } from "../shared/environment";
import { createTenantQueryHandler } from "../shared/tenant-query";

export const handler = createTenantQueryHandler({
  operation: "GetPaymentsByClientId",
  tableName: getTableName("payments"),
  indexName: "clientIDIndex",
  pathParameter: "clientId",
  lookupAttribute: "clientId",
  clientMayQueryOwnLookup: true,
});

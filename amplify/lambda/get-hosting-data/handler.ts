import { getTableName } from "../shared/environment";
import { createTenantQueryHandler } from "../shared/tenant-query";

export const handler = createTenantQueryHandler({
  operation: "GetHostingData",
  tableName: getTableName("hosting"),
  clientIndexName: "clientIDIndex",
  clientLookupAttribute: "clientId",
});

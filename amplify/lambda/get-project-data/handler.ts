import { getTableName } from "../shared/environment";
import { createTenantQueryHandler } from "../shared/tenant-query";

export const handler = createTenantQueryHandler({
  operation: "GetProjectData",
  tableName: getTableName("projects"),
  clientIndexName: "clientIDIndex",
  clientLookupAttribute: "clientId",
});

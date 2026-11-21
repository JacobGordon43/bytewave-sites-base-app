import { getTableName } from "../shared/environment";
import { createTenantQueryHandler } from "../shared/tenant-query";

export const handler = createTenantQueryHandler({
  operation: "GetTicketsByUserId",
  tableName: getTableName("tickets"),
  indexName: "createdByIDIndex",
  pathParameter: "userId",
  lookupAttribute: "createdById",
  clientMayQueryOwnLookup: true,
});

import { getTableName } from "../shared/environment";
import { createTenantQueryHandler } from "../shared/tenant-query";

export const handler = createTenantQueryHandler({
  operation: "GetMessageData",
  tableName: getTableName("messages"),
  allowClient: false,
});

import { createProtectedTenantDeleteHandler } from "../shared/tenant-crud";
import { getTableName } from "../shared/environment";

export const handler = createProtectedTenantDeleteHandler({
  tableName: getTableName("portfolio"),
  resourceName: "Portfolio item",
});

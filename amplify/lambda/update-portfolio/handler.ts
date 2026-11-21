import { createProtectedTenantUpdateHandler } from "../shared/tenant-crud";
import { getTableName } from "../shared/environment";

export const handler = createProtectedTenantUpdateHandler({
  tableName: getTableName("portfolio"),
  resourceName: "Portfolio item",
});

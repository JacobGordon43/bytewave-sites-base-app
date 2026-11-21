import { getTableName } from "../shared/environment";
import { createProtectedTenantDeleteHandler } from "../shared/tenant-crud";

export const handler = createProtectedTenantDeleteHandler({
  tableName: getTableName("customPages"),
  resourceName: "Custom page",
});

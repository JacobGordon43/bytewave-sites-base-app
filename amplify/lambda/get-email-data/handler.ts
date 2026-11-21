import { getTableName } from "../shared/environment";
import { createProtectedTenantCollectionHandler } from "../shared/tenant-crud";

export const handler = createProtectedTenantCollectionHandler({
  tableName: getTableName("emails"),
  resourceName: "Email subscription",
});

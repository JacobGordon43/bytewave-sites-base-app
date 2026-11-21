import { getTableName } from "../shared/environment";
import { createProtectedTenantUpdateHandler } from "../shared/tenant-crud";

export const handler = createProtectedTenantUpdateHandler({
  tableName: getTableName("rentals"),
  resourceName: "Rental",
});

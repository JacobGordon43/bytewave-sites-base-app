import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { createProtectedTenantItemHandler } from "../shared/tenant-crud";

const validatedHandler = createProtectedTenantItemHandler({
  tableName: getTableName("rentals"),
  resourceName: "Rental",
});

export const handler = withCreateValidation("/app/admin/rentals", validatedHandler, "POST");

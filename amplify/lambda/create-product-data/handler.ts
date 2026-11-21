import { withCreateValidation } from "../shared/validate-create";
import { getTableName } from "../shared/environment";
import { createProtectedTenantItemHandler } from "../shared/tenant-crud";

const validatedHandler = createProtectedTenantItemHandler({
  tableName: getTableName("products"),
  resourceName: "Product",
});

export const handler = withCreateValidation("/app/admin/products", validatedHandler, "POST");

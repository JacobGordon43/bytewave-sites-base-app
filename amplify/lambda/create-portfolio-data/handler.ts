import { validateCreateItem } from "../../../shared/create-validation";
import { createProtectedTenantItemHandler } from "../shared/tenant-crud";
import { getTableName } from "../shared/environment";

export const handler = createProtectedTenantItemHandler({
  tableName: getTableName("portfolio"),
  resourceName: "Portfolio item",
  prepareItem: (item) => { validateCreateItem("portfolio", item); return item; },
});


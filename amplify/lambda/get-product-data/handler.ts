import { getTableName } from "../shared/environment";
import { createPublicTenantCollectionHandler } from "../shared/tenant-crud";

export const handler = createPublicTenantCollectionHandler({
  tableName: getTableName("products"),
  resourceName: "Product",
});

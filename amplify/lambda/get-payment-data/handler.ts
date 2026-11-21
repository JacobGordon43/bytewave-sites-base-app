import { getTableName } from "../shared/environment";
import { ApiError, createTenantQueryHandler, getTenantIdentity, response } from "../shared/tenant-query";
import type { AuthenticatedApiEvent } from "../shared/types";

export const handler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    if (identity.privileged) {
      return createTenantQueryHandler({ operation: "GetPayments", tableName: getTableName("payments"), allowClient: false })(event);
    }
    if (!identity.subject) throw new ApiError(403, "A client identity is required.");
    return createTenantQueryHandler({
      operation: "GetClientPayments", tableName: getTableName("payments"), indexName: "clientIDIndex",
      pathParameter: "clientId", lookupAttribute: "clientId", clientMayQueryOwnLookup: true,
    })({ ...event, pathParameters: { ...event.pathParameters, clientId: identity.subject } });
  } catch (error) {
    return response(error instanceof ApiError ? error.statusCode : 500, { success: false, message: error instanceof ApiError ? error.message : "Unable to retrieve payments.", results: [] });
  }
};

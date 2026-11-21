const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

/**
 * Temporary handler used for business API operations that still need their
 * production implementation. Keeping these as real Lambda resources makes the
 * backend contract explicit without silently pretending that the operation ran.
 */
export function createPlaceholderHandler(operation: string) {
  return async () => ({
    isBase64Encoded: false,
    statusCode: 501,
    headers,
    body: JSON.stringify({
      success: false,
      placeholder: true,
      operation,
      message: `${operation} has been registered but is not implemented yet.`,
    }),
  });
}

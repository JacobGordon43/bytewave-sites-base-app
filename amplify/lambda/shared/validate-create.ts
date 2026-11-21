import { validateCreateRequest, ValidationError } from '../../../shared/create-validation';
import type { AuthenticatedApiEvent } from './types';

/** Validate every create entry point, including direct Lambda invocation. */
export function withCreateValidation<T>(path: string, handler: (event: AuthenticatedApiEvent) => Promise<T>, method = 'POST') {
  return async (event: AuthenticatedApiEvent) => {
    // Keep existing authentication responses. No unauthenticated write is allowed
    // through the underlying protected handlers.
    const protectedRoute = !path.startsWith('/public/');
    if (protectedRoute && !event.requestContext?.authorizer?.jwt?.claims) return handler(event);
    const requestMethod = event.requestContext?.http?.method ?? method;
    try {
      if (requestMethod === method) {
        let body: unknown = undefined;
        if (event.body) {
          try { body = JSON.parse(event.body); }
          catch { throw new ValidationError(['Request body must contain valid JSON']); }
        }
        validateCreateRequest(path, body, method);
      }
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
      return {
        isBase64Encoded: false,
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, message: error.message, errors: error.errors }),
      };
    }
    return handler(event);
  };
}

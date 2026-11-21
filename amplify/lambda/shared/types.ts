import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

/** All HTTP Lambda functions in this backend use API Gateway JWT authorization. */
export type AuthenticatedApiEvent = APIGatewayProxyEventV2WithJWTAuthorizer;

/** Cognito custom claims are dynamic, so normalize roles before authorization. */
export function getRoles(claimValue: unknown): string[] {
  if (Array.isArray(claimValue)) {
    return claimValue.filter((role): role is string => typeof role === "string");
  }

  return typeof claimValue === "string" ? [claimValue] : [];
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

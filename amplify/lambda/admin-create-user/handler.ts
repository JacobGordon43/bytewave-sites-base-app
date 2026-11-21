import { withCreateValidation } from "../shared/validate-create";
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  ApiError,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";
import type { AuthenticatedApiEvent } from "../shared/types";

const cognito = new CognitoIdentityProviderClient({});
const ADMIN_ROLES = new Set(["Bytewave-Admin"]);
const CLIENT_GROUP = "Client";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateUserRequest = {
  email?: unknown;
  groupName?: unknown;
};

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  let createdUsername: string | undefined;

  try {
    const identity = getTenantIdentity(event);
    if (!identity.roles.some((role) => ADMIN_ROLES.has(role))) {
      throw new ApiError(403, "Only administrators can create client users.");
    }

    const userPoolId = process.env.USER_POOL_ID;
    if (!userPoolId) {
      throw new Error("USER_POOL_ID is not configured.");
    }

    const request = parseRequest(event.body);
    const email = validateEmail(request.email);
    const groupName = validateGroup(request.groupName);

    const createResult = await cognito.send(new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "false" },
        { Name: "custom:businessId", Value: identity.businessId },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
    }));

    createdUsername = createResult.User?.Username ?? email;

    try {
      await cognito.send(new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: createdUsername,
        GroupName: groupName,
      }));
    } catch (error: unknown) {
      await rollbackCreatedUser(userPoolId, createdUsername);
      createdUsername = undefined;
      throw error;
    }

    return response(201, {
      success: true,
      message: "The client user was created and added to the Client group.",
      user: {
        Username: createdUsername,
        Sub: createResult.User?.Attributes?.find(({ Name }) => Name === "sub")?.Value,
        UserStatus: createResult.User?.UserStatus,
        UserCreateDate: createResult.User?.UserCreateDate,
      },
    }, "OPTIONS,POST");
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return response(error.statusCode, {
        success: false,
        message: error.message,
      }, "OPTIONS,POST");
    }

    const cognitoError = mapCognitoError(error);
    if (cognitoError) {
      return response(cognitoError.statusCode, {
        success: false,
        message: cognitoError.message,
      }, "OPTIONS,POST");
    }

    console.error("AdminCreateUser failed", {
      error,
      rollbackRequired: Boolean(createdUsername),
    });
    return response(500, {
      success: false,
      message: "The client user could not be created.",
    }, "OPTIONS,POST");
  }
};

function parseRequest(rawBody: string | undefined): CreateUserRequest {
  if (!rawBody) throw new ApiError(400, "A request body is required.");

  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ApiError(400, "The request body must be a JSON object.");
    }
    return parsed as CreateUserRequest;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "The request body contains invalid JSON.");
  }
}

function validateEmail(rawEmail: unknown): string {
  if (typeof rawEmail !== "string") {
    throw new ApiError(400, "A valid email address is required.");
  }

  const email = rawEmail.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }
  return email;
}

function validateGroup(rawGroupName: unknown): string {
  if (rawGroupName !== undefined && rawGroupName !== CLIENT_GROUP) {
    throw new ApiError(400, `groupName must be ${CLIENT_GROUP}.`);
  }
  return CLIENT_GROUP;
}

async function rollbackCreatedUser(userPoolId: string, username: string) {
  try {
    await cognito.send(new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }));
  } catch (rollbackError: unknown) {
    console.error("AdminCreateUser rollback failed", rollbackError);
  }
}

function mapCognitoError(error: unknown): ApiError | undefined {
  if (!(error instanceof Error)) return undefined;

  switch (error.name) {
    case "UsernameExistsException":
      return new ApiError(409, "A user with this email address already exists.");
    case "InvalidParameterException":
    case "InvalidPasswordException":
      return new ApiError(400, "Cognito rejected the supplied user information.");
    case "TooManyRequestsException":
    case "LimitExceededException":
      return new ApiError(429, "User creation is temporarily rate limited. Please try again.");
    default:
      return undefined;
  }
}

export const handler = withCreateValidation("/internal/users", validatedHandler, "POST");

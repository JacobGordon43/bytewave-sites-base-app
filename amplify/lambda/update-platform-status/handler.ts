import { withCreateValidation } from "../shared/validate-create";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  ApiError,
  getTenantIdentity,
  response,
} from "../shared/tenant-query";
import type { AuthenticatedApiEvent } from "../shared/types";

const s3 = new S3Client({});
const ADMIN_ROLES = new Set(["Bytewave-Admin"]);
const PLATFORM_STATUSES = new Set([
  "operational",
  "emergency-shutdown",
  "infrastructure-maintenance",
]);

type UpdatePlatformStatusRequest = {
  platformStatus?: unknown;
};

const validatedHandler = async (event: AuthenticatedApiEvent) => {
  try {
    const identity = getTenantIdentity(event);
    if (!identity.roles.some((role) => ADMIN_ROLES.has(role))) {
      throw new ApiError(403, "Only administrators can update the platform status.");
    }

    const bucketName = process.env.STATUS_BUCKET_NAME;
    const objectKey = process.env.STATUS_OBJECT_KEY;
    if (!bucketName || !objectKey) {
      throw new Error("Platform status storage is not configured.");
    }

    const request = parseRequest(event.body);
    const platformStatus = validateStatus(request.platformStatus);
    const lastUpdated = Date.now();

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: JSON.stringify({ platformStatus, lastUpdated }),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "no-store, max-age=0",
    }));

    return response(200, {
      success: true,
      message: `Status changed to ${platformStatus}.`,
      platformStatus,
      lastUpdated,
    }, "OPTIONS,POST");
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return response(error.statusCode, {
        success: false,
        message: error.message,
      }, "OPTIONS,POST");
    }

    console.error("UpdatePlatformStatus failed", error);
    return response(500, {
      success: false,
      message: "The platform status could not be updated.",
    }, "OPTIONS,POST");
  }
};

function parseRequest(rawBody: string | undefined): UpdatePlatformStatusRequest {
  if (!rawBody) throw new ApiError(400, "A request body is required.");

  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ApiError(400, "The request body must be a JSON object.");
    }
    return parsed as UpdatePlatformStatusRequest;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "The request body contains invalid JSON.");
  }
}

function validateStatus(rawStatus: unknown): string {
  if (typeof rawStatus !== "string" || !PLATFORM_STATUSES.has(rawStatus)) {
    throw new ApiError(
      400,
      "platformStatus must be operational, emergency-shutdown, or infrastructure-maintenance.",
    );
  }
  return rawStatus;
}

export const handler = withCreateValidation("/internal/platform/status", validatedHandler, "POST");

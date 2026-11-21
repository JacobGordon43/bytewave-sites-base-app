import { withCreateValidation } from "../shared/validate-create";
import { getErrorMessage, type AuthenticatedApiEvent } from "../shared/types";
import { getBusinessIdFromClaims, getRolesFromClaims } from "../helper";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const s3 = new S3Client({region: process.env.REGION})

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 20;
const SAFE_PATH_SEGMENT_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

const allowedRoles = [
    "Bytewave-Admin",
    "Support",
    "Admin"
];

const allowedFileTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
]);

const allowedCategories = new Set([
    "about",
    "beliefs",
    "business-info",
    "connect-home",
    "connect-men",
    "connect-women",
    "connect-groups",
    "connect-kids",
    "connect-youth",
    "custom-pages",
    "events",
    "faqs",
    "sermons",
    "services",
]);

const categoryAliases: Record<string, string> = {
    custompage: "custom-pages",
    custompages: "custom-pages",
    faq: "faqs",
};

type PresignFileRequest = {
    id?: unknown;
    type?: unknown;
    size?: unknown;
};

type PresignRequestBody = {
    category?: unknown;
    files?: unknown;
};

function validatePathSegment(value: unknown, fieldName: string) {
    if (typeof value !== "string" || !SAFE_PATH_SEGMENT_PATTERN.test(value)) {
        throw new Error(`${fieldName} contains invalid characters`);
    }

    return value;
}

function normalizeCategory(value: unknown) {
    if (typeof value !== "string") {
        throw new Error("category is required");
    }

    const normalized = value
        .trim()
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/_/g, "-")
        .toLowerCase();
    const category = categoryAliases[normalized] ?? normalized;

    if (!allowedCategories.has(category)) {
        throw new Error("Upload category is not allowed");
    }

    return category;
}

function validateFile(file: PresignFileRequest) {
    const id = validatePathSegment(file.id, "file.id");

    if (typeof file.type !== "string") {
        throw new Error("file.type is required");
    }

    const extension = allowedFileTypes.get(file.type);
    if (!extension) {
        throw new Error(`File type not allowed: ${file.type}`);
    }

    if (typeof file.size !== "number" || !Number.isFinite(file.size) || file.size <= 0) {
        throw new Error("file.size must be a positive number");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error("File too large (10MB max)");
    }

    return {
        id,
        contentType: file.type,
        extension,
        size: file.size,
    };
}

const validatedHandler = async (event: AuthenticatedApiEvent) =>{
    let body;
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    let statusCode = 200;
    let headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
    };
    try{
        const parsedBody: unknown = JSON.parse(event.body || '{}');
        if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
            throw new Error("Request body must be a JSON object");
        }
        const requestBody = parsedBody as PresignRequestBody;

        if (!claims) {
          return {
            isBase64Encoded: false,
            statusCode: 403,
            headers,
            body: JSON.stringify({
              success: false,
              results: [],
              message: "No claims data was found. Please contact your administrator."
            })
          };
        }
        const businessId = getBusinessIdFromClaims(claims);
        const roles = getRolesFromClaims(claims);
        if(!roles.some(role=>allowedRoles.includes((role as string)))){
            return {
                "isBase64Encoded": false,
                statusCode: 403,
                headers,
                body: JSON.stringify({
                  success: false,
                  results: [],
                  message: "You do not have access to this data."
                })
            }
        }
        const category = normalizeCategory(requestBody.category);
        const files = requestBody.files;
        const bucketName = process.env.BUCKET_NAME;
        const region = process.env.REGION;
        const safeBusinessId = validatePathSegment(businessId, "businessId");

        if(!bucketName || !region){
            throw new Error("Upload configuration is missing");
        }
        if(!files || !Array.isArray(files)){
            throw new Error("Files was undefined or was not an array")
        }
        if(files.length > MAX_FILES_PER_REQUEST){
            throw new Error("Too many files requested")
        }
        const results = await Promise.all(
            files.map(async (file: PresignFileRequest) =>{
                const validatedFile = validateFile(file);
                const key = `${safeBusinessId}/${category}/${randomUUID()}.${validatedFile.extension}`

                const command = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                    ContentType: validatedFile.contentType,
                    ContentLength: validatedFile.size
                })

                const uploadUrl = await getSignedUrl(s3, command, {
                    expiresIn: 60 * 5 //5 minutes
                })

                const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
                return {id: validatedFile.id, uploadUrl, key, fileUrl}
            })
        )
        body = {message: "Presigned URL was provided", results, "success": true};

    }catch (err: unknown){
        statusCode = 400
        body = {"message": getErrorMessage(err), "success": false}
    }finally{
        body = JSON.stringify(body)
    }

  return {
    "isBase64Encoded": false,
    headers,
    statusCode,
    body
  }; 
}

export const handler = withCreateValidation("/app/files/presign", validatedHandler, "POST");

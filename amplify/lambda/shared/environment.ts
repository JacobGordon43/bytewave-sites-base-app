function tableEnvironmentVariable(tableName: string) {
  return `TABLE_${tableName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_ARN`;
}

/**
 * Resolve the deployed physical table name for a logical table.
 *
 * Production currently keeps its existing physical names, while test branches
 * and sandboxes use CloudFormation-generated names. The backend injects the
 * correct table ARN into every Lambda that has access to the table. The ARN is
 * already shared with each function stack for IAM, so reusing it avoids adding
 * another CloudFormation output for every table and resource group.
 */
export function getTableName(tableName: string) {
  const environmentVariable = tableEnvironmentVariable(tableName);
  const tableArn = process.env[environmentVariable];

  if (!tableArn) {
    throw new Error(
      `Missing required Lambda environment variable ${environmentVariable}.`,
    );
  }

  const tableMarker = ":table/";
  const tableMarkerIndex = tableArn.indexOf(tableMarker);
  if (tableMarkerIndex === -1) {
    throw new Error(`${environmentVariable} is not a valid DynamoDB table ARN.`);
  }

  const deployedTableName = tableArn.slice(tableMarkerIndex + tableMarker.length);
  if (!deployedTableName || deployedTableName.includes("/")) {
    throw new Error(`${environmentVariable} is not a DynamoDB table ARN.`);
  }

  return deployedTableName;
}

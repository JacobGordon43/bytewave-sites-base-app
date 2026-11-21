import { applicationConfig } from "./application-config";
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
// import { data } from './data/resource';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod
} from "aws-cdk-lib/aws-apigatewayv2";
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import type { IFunction } from 'aws-cdk-lib/aws-lambda';
import { addApiRoutes } from './routes';
import { businessFunctions } from './businessFunctions';
import { stripeEventsConfig } from './stripe-events-config';
import { connectStripeEvents } from './stripe-events';
import { connectBillingNotifications } from './billing-notifications';
import { addMonitoring } from './monitoring';
import { billingNotifications } from './lambda/billing-notifications/resource';
import { getBusinessRoutes } from './businessRoutes';
//Function imports
import { batchDeleteBeliefs } from './lambda/batch-delete-beliefs/resource';
import { batchDeleteCustomPage } from './lambda/batch-delete-custom-page/resource';
import { batchUpdateBeliefs } from './lambda/batch-update-beliefs/resource';
import { batchUpdateCustomPage } from './lambda/batch-update-custom-page/resource';
import { batchDeleteFAQ } from './lambda/batch-delete-faq/resource';
import { batchDeleteServices } from './lambda/batch-delete-services/resource';
import { batchUpdateFAQ } from './lambda/batch-update-faq/resource';
import { batchUpdateServices } from './lambda/batch-update-services/resource';
import { deleteService } from './lambda/delete-services/resource';
import { createBeliefData } from './lambda/create-belief-data/resource';
import { createSermonData } from './lambda/create-sermon-data/resource';
import { createRentalData } from './lambda/create-rental-data/resource';
import { createProductData } from './lambda/create-product-data/resource';
import { createEmailData } from './lambda/create-email-data/resource';
import { sendCustomEmail } from './lambda/send-custom-email/resource';
import { createEventData } from './lambda/create-event-data/resource';
import { createBusinessData } from './lambda/create-business-data/resource';
import { deleteBeliefData } from './lambda/delete-belief-data/resource';
import { deleteSermonData } from './lambda/delete-sermon-data/resource';
import { deleteRentalData } from './lambda/delete-rental-data/resource';
import { deleteProductData } from './lambda/delete-product-data/resource';
import { deleteEventData } from './lambda/delete-event-data/resource';
import { createBusinessInfoData } from './lambda/create-business-info-data/resource';
import { createClientData } from './lambda/create-client-data/resource';
import { createContactFormLogs } from './lambda/create-contact-form-logs/resource';
import { createCustomPageData } from './lambda/create-custom-page-data/resource';
import { createFAQData } from './lambda/create-faq-data/resource';
import { createHostingData } from './lambda/create-hosting-data/resource';
import { createMessageData } from './lambda/create-message-data/resource';
import { createPaymentData } from './lambda/create-payment-data/resource';
import { createPortfolioData } from './lambda/create-portfolio-data/resource';
import { createReferralData } from './lambda/create-referral-data/resource';
import { createServiceData } from './lambda/create-service-data/resource';
import { createTicketData } from './lambda/create-ticket-data/resource';
import { createWorkOrderData } from './lambda/create-work-order-data/resource';
import { deleteBusinessData } from './lambda/delete-business-data/resource';
import { deleteBusinessInfoData } from './lambda/delete-business-info-data/resource';
import { deleteClientData } from './lambda/delete-client-data/resource';
import { deleteContactFormLogs } from './lambda/delete-contact-form-logs/resource';
import { deleteCustomPage } from './lambda/delete-custom-page-data/resource';
import { deleteEmailData } from './lambda/delete-email-data/resource';
import { deleteFAQData } from './lambda/delete-faq-data/resource';
import { deleteHostingData } from './lambda/delete-hosting-data/resource';
import { deleteMessageData } from './lambda/delete-message-data/resource';
import { deletePaymentData } from './lambda/delete-payment-data/resource';
import { deleteReferralData } from './lambda/delete-referral-data/resource';
import { deleteServiceData } from './lambda/delete-service-data/resource';
import { deleteTicketData } from './lambda/delete-ticket-data/resource';
import { deleteWorkOrderData } from './lambda/delete-work-order-data/resource';
import { getBeliefData } from './lambda/get-belief-data/resource';
import { getSermonData } from './lambda/get-sermon-data/resource';
import { getRentalData } from './lambda/get-rental-data/resource';
import { getProductData } from './lambda/get-product-data/resource';
import { getEmailData } from './lambda/get-email-data/resource';
import { getEventData } from './lambda/get-event-data/resource';
import { getBusinessData } from './lambda/get-business-data/resource';
import { getBusinessMetricData } from './lambda/get-business-metric-data/resource';
import { getBusinessInfoData } from './lambda/get-business-info-data/resource';
import { getClientData } from './lambda/get-client-data/resource';
import { getClientById } from './lambda/get-client-by-id/resource';
import { getContactFormLogs } from './lambda/get-contact-form-logs/resource';
import { getCustomPageData } from './lambda/get-custom-page-data/resource';
import { getEmailSubscriberCount } from './lambda/get-email-subscriber-count/resource';
import { getFAQData } from './lambda/get-faq-data/resource';
import { getHostingData } from './lambda/get-hosting-data/resource';
import { getMessageData } from './lambda/get-message-data/resource';
import { getPaymentData } from './lambda/get-payment-data/resource';
import { getPresignURL } from './lambda/get-presign-url/resource';
import { getReferralData } from './lambda/get-referral-data/resource';
import { getServiceData } from './lambda/get-service-data/resource';
import { getTicketData } from './lambda/get-ticket-data/resource';
import { getTicketById } from './lambda/get-ticket-by-id/resource';
import { getTicketsByUserId } from './lambda/tickets-by-user-id/resource';
import { getWorkOrderData } from './lambda/get-work-order-data/resource';
import { getWorkingTicketData } from './lambda/get-working-ticket-data/resource';
import { getMessagesByChatId } from './lambda/messages-by-chat-id/resource';
import { updateBusinessData } from './lambda/update-business-data/resource';
import { updateBeliefData } from './lambda/update-belief-data/resource';
import { updateSermonData } from './lambda/update-sermon-data/resource';
import { updateRentalData } from './lambda/update-rental-data/resource';
import { updateProductData } from './lambda/update-product-data/resource';
import { updateEmailData } from './lambda/update-email-data/resource';
import { updateEventData } from './lambda/update-event-data/resource';
import { updateBusinessInfoData } from './lambda/update-business-info-data/resource';
import { updateClientData } from './lambda/update-client-data/resource';
import { updateContactFormLogs } from './lambda/update-contact-form-logs/resource';
import { updateCustomPageData } from './lambda/update-custom-page-data/resource';
import { updateFAQData } from './lambda/update-faq-data/resource';
import { updateHostingData } from './lambda/update-hosting-data/resource';
import { updateMessageData } from './lambda/update-message-data/resource';
import { updatePaymentData } from './lambda/update-payment-data/resource';
import { updatePortfolio } from './lambda/update-portfolio/resource';
import { updateReferralData } from './lambda/update-referral-data/resource';
import { updateServiceData } from './lambda/update-service-data/resource';
import { updateTicketData } from './lambda/update-ticket-data/resource';
import { updateWorkOrderData } from './lambda/update-work-order-data/resource';
import { tableConfigs } from './dynamoTables';
import { AttributeType, Billing, TableV2, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

type TableAccess =
  | "read"
  | "create"
  | "readCreate"
  | "update"
  | "delete"
  | "readDelete"
  | "readUpdate"
  | "batchWrite"
  | "transactionWrite"
  | "transactionCreateUpdate"
  | "transactionReadCheckUpdate"
  | "readWrite";

type BackendFunctionResource = {
  resources: {
    lambda: IFunction;
  };
  addEnvironment: (key: string, value: string) => void;
};

const deploymentEnvironment = (
  process.env.AWS_BRANCH
  ?? process.env.DEPLOYMENT_ENV
  ?? "sandbox"
).trim().toLowerCase();

// All environments use generated physical table names for each new application.
// Monitoring is deferred until client revenue justifies the ongoing cost.
// To enable it, remove the false assignment and uncomment the original condition.
const monitoringEnabled = false;
// const monitoringEnabled = ["main", "production", "prod"].includes(deploymentEnvironment) || process.env.ENABLE_MONITORING === "true";

const tableEnvironmentVariable = (tableName: string) =>
  `TABLE_${tableName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_ARN`;

const backend = defineBackend({
  auth,
  ...businessFunctions,
  // data,
  batchDeleteBeliefs,
  batchDeleteCustomPage,
  batchUpdateBeliefs,
  batchDeleteFAQ,
  batchDeleteServices,
  batchUpdateCustomPage,
  batchUpdateFAQ,
  batchUpdateServices,
  createBeliefData,
  createSermonData,
  createRentalData,
  createProductData,
  createEmailData,
  sendCustomEmail,
  billingNotifications,
  createEventData,
  createBusinessData,
  createBusinessInfoData,
  createClientData,
  createContactFormLogs,
  createCustomPageData,
  createFAQData,
  createHostingData,
  createMessageData,
  createPaymentData,
  createPortfolioData,
  createReferralData,
  createServiceData,
  createTicketData,
  createWorkOrderData,
  deleteBeliefData,
  deleteSermonData,
  deleteRentalData,
  deleteProductData,
  deleteEventData,
  deleteBusinessData,
  deleteBusinessInfoData,
  deleteClientData,
  deleteContactFormLogs,
  deleteCustomPage,
  deleteEmailData,
  deleteFAQData,
  deleteHostingData,
  deleteMessageData,
  deletePaymentData,
  deleteReferralData,
  deleteServiceData,
  deleteTicketData,
  deleteWorkOrderData,
  getBeliefData,
  getSermonData,
  getRentalData,
  getProductData,
  getEmailData,
  getEventData,
  getBusinessData,
  getBusinessMetricData,
  getBusinessInfoData,
  getClientData,
  getClientById,
  getContactFormLogs,
  getCustomPageData,
  getEmailSubscriberCount,
  getFAQData,
  getHostingData,
  getMessageData,
  getPaymentData,
  getPresignURL,
  getReferralData,
  getServiceData,
  getTicketData,
  getTicketById,
  getTicketsByUserId,
  getWorkOrderData,
  getWorkingTicketData,
  getMessagesByChatId,
  updateBeliefData,
  updateSermonData,
  updateRentalData,
  updateProductData,
  updateEmailData,
  updateEventData,
  updateBusinessData,
  updateBusinessInfoData,
  updateClientData,
  updateContactFormLogs,
  updateCustomPageData,
  updateFAQData,
  updateHostingData,
  updateMessageData,
  updatePaymentData,
  updatePortfolio,
  updateReferralData,
  updateServiceData,
  updateTicketData,
  updateWorkOrderData,
  deleteService
});

// The business ID is an authorization boundary. Keep the custom attribute
// mutable so trusted administrative workflows can assign or correct it after
// account creation, but do not allow the browser app client to change it.
// Cognito treats an omitted WriteAttributes list as access to every writable
// standard and custom attribute, so this list must remain explicit.
backend.auth.resources.cfnResources.cfnUserPoolClient.writeAttributes = [
  "email",
];

const storageStack = backend.createStack("storage-stack");
const imagesBucket = Bucket.fromBucketName(storageStack, "BytewaveSitesImagesBucket", applicationConfig.imagesBucketName)
imagesBucket.grantPut(
  backend.getPresignURL.resources.lambda
);

const platformStatusBucket = Bucket.fromBucketName(
  storageStack,
  "BytewaveSitesPlatformBucket",
  applicationConfig.platformBucketName,
);
const platformStatusKey = "status.json";
backend.updatePlatformStatus.addEnvironment("STATUS_BUCKET_NAME", platformStatusBucket.bucketName);
backend.updatePlatformStatus.addEnvironment("STATUS_OBJECT_KEY", platformStatusKey);
backend.updatePlatformStatus.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: ["s3:PutObject"],
  resources: [platformStatusBucket.arnForObjects(platformStatusKey)],
}));

const dataStack = backend.createStack("data-stack")
const apiStack = backend.createStack("api-stack")
const httpApi = new HttpApi(apiStack, "BytewaveSitesHttpApi", {
  apiName: `${applicationConfig.name}-${deploymentEnvironment}-http-api`,
  corsPreflight: {
    allowOrigins: applicationConfig.allowedOrigins,
    allowMethods: [
      CorsHttpMethod.GET,
      CorsHttpMethod.POST,
      CorsHttpMethod.PUT,
      CorsHttpMethod.DELETE,
      CorsHttpMethod.OPTIONS
    ],
    allowHeaders: [
      "Content-Type",
      "Authorization"
    ]
  }
})

const userPool = backend.auth.resources.userPool;
const userPoolClient = backend.auth.resources.userPoolClient;

backend.adminCreateUser.addEnvironment("USER_POOL_ID", userPool.userPoolId);
backend.adminCreateUser.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: [
    "cognito-idp:AdminCreateUser",
    "cognito-idp:AdminAddUserToGroup",
    "cognito-idp:AdminDeleteUser",
  ],
  resources: [userPool.userPoolArn],
}));

const jwtAuthorizer = new HttpJwtAuthorizer(
  "BytewaveSitesJwtAuthorizer",
  `https://cognito-idp.${apiStack.region}.amazonaws.com/${userPool.userPoolId}`,
  {
    jwtAudience: [userPoolClient.userPoolClientId],
    authorizerName: "JWT-Auth"
  }
)

const tables = Object.fromEntries(
  tableConfigs.map((config)=> {
    const table = new TableV2(dataStack, config.constructId, {
      // Old images distinguish actual transitions from repeated Stripe synchronization.
      ...(["payments", "subscription-state"].includes(config.tableName)
        ? { dynamoStream: StreamViewType.NEW_AND_OLD_IMAGES } : {}),
      // New applications always use generated table names, including production.
      partitionKey: {
        name: config.partitionKey,
        type: AttributeType.STRING
      },
      sortKey: {
        name: config.sortKey,
        type: AttributeType.STRING
      },
      globalSecondaryIndexes: config.globalSecondaryIndexes?.map((index) => ({
        indexName: index.indexName,
        partitionKey: {
          name: index.partitionKey,
          type: AttributeType.STRING,
        },
        sortKey: {
          name: index.sortKey,
          type: index.sortKeyType === "number"
            ? AttributeType.NUMBER
            : AttributeType.STRING,
        },
      })),
      billing: Billing.onDemand(),
      removalPolicy: RemovalPolicy.RETAIN
    })
    return [config.tableName, table]
  })
)

  const grantTableAccess = ({
    tableName, access, functionResource
  } : {
    tableName: string,
    access: TableAccess,
    functionResource: BackendFunctionResource
  }) => {
    const table = tables[tableName];
    const lambda = functionResource.resources.lambda;

    if (!table) {
      throw new Error(`Unknown DynamoDB table: ${tableName}`);
    }

    functionResource.addEnvironment(
      tableEnvironmentVariable(tableName),
      table.tableArn,
    );

    const actionsByAccess: Record<TableAccess, string[]> = {
      read: [
        "dynamodb:GetItem",
        "dynamodb:Query",
      ],
      create: [
        "dynamodb:PutItem",
      ],
      readCreate: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
      ],
      update: [
        "dynamodb:UpdateItem",
      ],
      delete: [
        "dynamodb:DeleteItem",
      ],
      readDelete: [
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
      ],
      readUpdate: [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
      ],
      batchWrite: [
        "dynamodb:BatchWriteItem",
      ],
      transactionWrite: [
        // Transactions are authorized by their underlying item operations.
        // Our section-save transactions contain Put and Delete operations.
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
      ],
      transactionCreateUpdate: [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
      ],
      transactionReadCheckUpdate: [
        "dynamodb:GetItem",
        "dynamodb:ConditionCheckItem",
        "dynamodb:UpdateItem",
      ],
      readWrite: [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem",
      ],
    };

    lambda.addToRolePolicy(
      new PolicyStatement({
        actions: actionsByAccess[access],
        resources: [table.tableArn, `${table.tableArn}/index/*`]
      })
    )
  }

backend.getPresignURL.addEnvironment("BUCKET_NAME", applicationConfig.imagesBucketName)
backend.getPresignURL.addEnvironment("REGION", storageStack.region)
backend.sendCustomEmail.addEnvironment("SUPPORT_EMAIL", applicationConfig.supportEmail);
backend.sendCustomEmail.addEnvironment("BUSINESS_NAME", applicationConfig.displayName);
backend.billingNotifications.addEnvironment("BUSINESS_NAME", applicationConfig.displayName);

grantTableAccess({ tableName: 'payments', access: 'readUpdate', functionResource: backend.createStripeSession });
grantTableAccess({ tableName: 'payments', access: 'readUpdate', functionResource: backend.getStripeSession });
grantTableAccess({ tableName: 'payments', access: 'readUpdate', functionResource: backend.stripeWebhook });

// Subscription permissions are table-specific. Only the EventBridge consumer can
// grant hosting or write renewal receipts; checkout/status APIs cannot do either.
function grantSubscriptionOperations(functionResource: BackendFunctionResource, tableName: string, operations: string[]) {
  const table = tables[tableName];
  functionResource.addEnvironment(tableEnvironmentVariable(tableName), table.tableArn);
  functionResource.resources.lambda.addToRolePolicy(new PolicyStatement({
    actions: operations.map(operation => `dynamodb:${operation}`), resources: [table.tableArn],
  }));
}
grantSubscriptionOperations(backend.createStripeSession, 'subscription-state', ['GetItem', 'PutItem', 'UpdateItem', 'DeleteItem']);
grantSubscriptionOperations(backend.getStripeSession, 'subscription-state', ['GetItem', 'UpdateItem', 'DeleteItem']);
grantSubscriptionOperations(backend.stripeWebhook, 'subscription-state', ['GetItem', 'PutItem', 'UpdateItem', 'DeleteItem']);
grantSubscriptionOperations(backend.stripeWebhook, 'hosting', ['Query', 'PutItem']);
grantSubscriptionOperations(backend.stripeWebhook, 'payments', ['PutItem']);
grantSubscriptionOperations(backend.stripeWebhook, 'business-metrics', ['UpdateItem']);
grantSubscriptionOperations(backend.manageSubscriptions, 'subscription-state', ['GetItem', 'Query', 'UpdateItem', 'DeleteItem']);

// Only this worker reads client email addresses and writes the notification ledger.
grantSubscriptionOperations(backend.billingNotifications, 'clients', ['GetItem']);
grantSubscriptionOperations(backend.billingNotifications, 'billing-notifications', ['GetItem', 'UpdateItem']);
for (const name of ['payments', 'subscription-state']) {
  backend.billingNotifications.addEnvironment(tableEnvironmentVariable(name), tables[name].tableArn);
}
const billingResources = connectBillingNotifications(
  backend.billingNotifications.resources.lambda,
  [tables.payments, tables['subscription-state']],
  monitoringEnabled,
);
backend.billingNotifications.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: ['ses:SendEmail'],
  resources: [apiStack.formatArn({ service: 'ses', resource: 'identity', resourceName: '*' })],
  conditions: { StringEquals: { 'ses:FromAddress': applicationConfig.billingEmailFrom } },
}));

// EventBridge calls the consumer directly. There is no API Gateway webhook route
// and no Stripe HTTP signing secret in this event delivery setup.
const stripeEvents = stripeEventsConfig(deploymentEnvironment);
let stripeResources: ReturnType<typeof connectStripeEvents> | undefined;
if (stripeEvents) {
  backend.stripeWebhook.addEnvironment("STRIPE_EVENT_SOURCE", stripeEvents.source);
  backend.stripeWebhook.addEnvironment("STRIPE_EVENT_ACCOUNT", stripeEvents.account);
  backend.stripeWebhook.addEnvironment("STRIPE_EVENT_REGION", stripeEvents.region);
  backend.stripeWebhook.addEnvironment("STRIPE_EVENT_MODE", stripeEvents.mode);
  stripeResources = connectStripeEvents(backend.stripeWebhook.resources.lambda, stripeEvents);
} else {
  console.warn("Stripe EventBridge is not configured for this branch. Set STRIPE_EVENT_BUS_ARN and STRIPE_EVENT_MODE before accepting payments.");
}

grantTableAccess({ tableName: 'customPages', access: 'batchWrite', functionResource: backend.batchDeleteCustomPage });
grantTableAccess({ tableName: 'beliefs', access: 'batchWrite', functionResource: backend.batchDeleteBeliefs });
grantTableAccess({ tableName: 'faq', access: 'batchWrite', functionResource: backend.batchDeleteFAQ });
grantTableAccess({ tableName: 'services', access: 'batchWrite', functionResource: backend.batchDeleteServices });
grantTableAccess({ tableName: 'customPages', access: 'transactionWrite', functionResource: backend.batchUpdateCustomPage });
grantTableAccess({ tableName: 'beliefs', access: 'transactionWrite', functionResource: backend.batchUpdateBeliefs });
grantTableAccess({ tableName: 'faq', access: 'transactionWrite', functionResource: backend.batchUpdateFAQ });
grantTableAccess({ tableName: 'services', access: 'transactionWrite', functionResource: backend.batchUpdateServices });
grantTableAccess({ tableName: 'businesses', access: 'create', functionResource: backend.createBusinessData });
grantTableAccess({ tableName: 'beliefs', access: 'create', functionResource: backend.createBeliefData });
grantTableAccess({ tableName: 'sermons', access: 'create', functionResource: backend.createSermonData });
grantTableAccess({ tableName: 'rentals', access: 'create', functionResource: backend.createRentalData });
grantTableAccess({ tableName: 'products', access: 'create', functionResource: backend.createProductData });
grantTableAccess({ tableName: 'emails', access: 'create', functionResource: backend.createEmailData });
grantTableAccess({ tableName: 'events', access: 'create', functionResource: backend.createEventData });
grantTableAccess({ tableName: 'business-info', access: 'create', functionResource: backend.createBusinessInfoData });
grantTableAccess({ tableName: 'clients', access: 'create', functionResource: backend.createClientData });
grantTableAccess({ tableName: 'contact-form-logs', access: 'create', functionResource: backend.createContactFormLogs });
grantTableAccess({ tableName: 'business-info', access: 'read', functionResource: backend.createContactFormLogs });
grantTableAccess({ tableName: 'customPages', access: 'create', functionResource: backend.createCustomPageData });
grantTableAccess({ tableName: 'faq', access: 'create', functionResource: backend.createFAQData });
grantTableAccess({ tableName: 'hosting', access: 'create', functionResource: backend.createHostingData });
grantTableAccess({ tableName: 'messages', access: 'create', functionResource: backend.createMessageData });
grantTableAccess({ tableName: 'tickets', access: 'transactionReadCheckUpdate', functionResource: backend.createMessageData });
grantTableAccess({ tableName: 'payments', access: 'create', functionResource: backend.createPaymentData });
grantTableAccess({ tableName: 'business-metrics', access: 'update', functionResource: backend.createPaymentData });
grantTableAccess({ tableName: 'portfolio', access: 'create', functionResource: backend.createPortfolioData });
grantTableAccess({ tableName: 'referrals', access: 'create', functionResource: backend.createReferralData });
grantTableAccess({ tableName: 'services', access: 'create', functionResource: backend.createServiceData });
grantTableAccess({ tableName: 'tickets', access: 'transactionCreateUpdate', functionResource: backend.createTicketData });
grantTableAccess({ tableName: 'work-orders', access: 'create', functionResource: backend.createWorkOrderData });
grantTableAccess({ tableName: 'businesses', access: 'delete', functionResource: backend.deleteBusinessData });
grantTableAccess({ tableName: 'beliefs', access: 'delete', functionResource: backend.deleteBeliefData });
grantTableAccess({ tableName: 'sermons', access: 'delete', functionResource: backend.deleteSermonData });
grantTableAccess({ tableName: 'rentals', access: 'delete', functionResource: backend.deleteRentalData });
grantTableAccess({ tableName: 'products', access: 'delete', functionResource: backend.deleteProductData });
grantTableAccess({ tableName: 'events', access: 'delete', functionResource: backend.deleteEventData });
grantTableAccess({ tableName: 'business-info', access: 'delete', functionResource: backend.deleteBusinessInfoData });
grantTableAccess({ tableName: 'clients', access: 'delete', functionResource: backend.deleteClientData });
grantTableAccess({ tableName: 'contact-form-logs', access: 'delete', functionResource: backend.deleteContactFormLogs });
grantTableAccess({ tableName: 'customPages', access: 'delete', functionResource: backend.deleteCustomPage });
grantTableAccess({ tableName: 'emails', access: 'delete', functionResource: backend.deleteEmailData });
grantTableAccess({ tableName: 'faq', access: 'delete', functionResource: backend.deleteFAQData });
grantTableAccess({ tableName: 'hosting', access: 'delete', functionResource: backend.deleteHostingData });
grantTableAccess({ tableName: 'messages', access: 'delete', functionResource: backend.deleteMessageData });
grantTableAccess({ tableName: 'payments', access: 'readDelete', functionResource: backend.deletePaymentData });
grantTableAccess({ tableName: 'business-metrics', access: 'update', functionResource: backend.deletePaymentData });
grantTableAccess({ tableName: 'referrals', access: 'delete', functionResource: backend.deleteReferralData });
grantTableAccess({ tableName: 'services', access: 'batchWrite', functionResource: backend.deleteService });
grantTableAccess({ tableName: 'services', access: 'delete', functionResource: backend.deleteServiceData });
grantTableAccess({ tableName: 'tickets', access: 'delete', functionResource: backend.deleteTicketData });
grantTableAccess({ tableName: 'work-orders', access: 'delete', functionResource: backend.deleteWorkOrderData });
grantTableAccess({ tableName: 'businesses', access: 'read', functionResource: backend.getBusinessData });
grantTableAccess({ tableName: 'beliefs', access: 'read', functionResource: backend.getBeliefData });
grantTableAccess({ tableName: 'sermons', access: 'read', functionResource: backend.getSermonData });
grantTableAccess({ tableName: 'rentals', access: 'read', functionResource: backend.getRentalData });
grantTableAccess({ tableName: 'products', access: 'read', functionResource: backend.getProductData });
grantTableAccess({ tableName: 'emails', access: 'read', functionResource: backend.getEmailData });
grantTableAccess({ tableName: 'events', access: 'read', functionResource: backend.getEventData });
grantTableAccess({ tableName: 'business-info', access: 'read', functionResource: backend.getBusinessInfoData });
grantTableAccess({ tableName: 'clients', access: 'read', functionResource: backend.getClientData });
grantTableAccess({ tableName: 'clients', access: 'read', functionResource: backend.getClientById });
grantTableAccess({ tableName: 'contact-form-logs', access: 'read', functionResource: backend.getContactFormLogs });
grantTableAccess({ tableName: 'customPages', access: 'read', functionResource: backend.getCustomPageData });
grantTableAccess({ tableName: 'emails', access: 'read', functionResource: backend.getEmailSubscriberCount });
grantTableAccess({ tableName: 'faq', access: 'read', functionResource: backend.getFAQData });
grantTableAccess({ tableName: 'hosting', access: 'read', functionResource: backend.getHostingData });
grantTableAccess({ tableName: 'messages', access: 'read', functionResource: backend.getMessageData });
grantTableAccess({ tableName: 'messages', access: 'read', functionResource: backend.getMessagesByChatId });
grantTableAccess({ tableName: 'payments', access: 'read', functionResource: backend.getPaymentData });
grantTableAccess({ tableName: 'business-metrics', access: 'read', functionResource: backend.getBusinessMetricData });
grantTableAccess({ tableName: 'payments', access: 'read', functionResource: backend.getPaymentsByClientId });
grantTableAccess({ tableName: 'referrals', access: 'read', functionResource: backend.getReferralData });
grantTableAccess({ tableName: 'referrals', access: 'read', functionResource: backend.getReferralsByClientId });
grantTableAccess({ tableName: 'portfolio', access: 'read', functionResource: backend.getPortfolioData });
grantTableAccess({ tableName: 'portfolio', access: 'delete', functionResource: backend.deletePortfolioData });
grantTableAccess({ tableName: 'projects', access: 'create', functionResource: backend.createProjectData });
grantTableAccess({ tableName: 'projects', access: 'read', functionResource: backend.getProjectData });
grantTableAccess({ tableName: 'projects', access: 'update', functionResource: backend.updateProjectData });
grantTableAccess({ tableName: 'projects', access: 'delete', functionResource: backend.deleteProjectData });
grantTableAccess({ tableName: 'services', access: 'read', functionResource: backend.getServiceData });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getTicketData });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getTicketById });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getTicketsByUserId });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getTicketsAfterDate });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getWorkingTicketData });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getMessagesByChatId });
grantTableAccess({ tableName: 'tickets', access: 'read', functionResource: backend.getMetadata });
grantTableAccess({ tableName: 'work-orders', access: 'read', functionResource: backend.getWorkOrderData });
grantTableAccess({ tableName: 'businesses', access: 'update', functionResource: backend.updateBusinessData });
grantTableAccess({ tableName: 'beliefs', access: 'update', functionResource: backend.updateBeliefData });
grantTableAccess({ tableName: 'sermons', access: 'update', functionResource: backend.updateSermonData });
grantTableAccess({ tableName: 'rentals', access: 'update', functionResource: backend.updateRentalData });
grantTableAccess({ tableName: 'products', access: 'update', functionResource: backend.updateProductData });
grantTableAccess({ tableName: 'emails', access: 'update', functionResource: backend.updateEmailData });
grantTableAccess({ tableName: 'events', access: 'update', functionResource: backend.updateEventData });
grantTableAccess({ tableName: 'business-info', access: 'update', functionResource: backend.updateBusinessInfoData });
grantTableAccess({ tableName: 'clients', access: 'update', functionResource: backend.updateClientData });
grantTableAccess({ tableName: 'contact-form-logs', access: 'update', functionResource: backend.updateContactFormLogs });
grantTableAccess({ tableName: 'customPages', access: 'update', functionResource: backend.updateCustomPageData });
grantTableAccess({ tableName: 'faq', access: 'update', functionResource: backend.updateFAQData });
grantTableAccess({ tableName: 'hosting', access: 'update', functionResource: backend.updateHostingData });
grantTableAccess({ tableName: 'messages', access: 'update', functionResource: backend.updateMessageData });
grantTableAccess({ tableName: 'payments', access: 'readUpdate', functionResource: backend.updatePaymentData });
grantTableAccess({ tableName: 'business-metrics', access: 'update', functionResource: backend.updatePaymentData });
grantTableAccess({ tableName: 'portfolio', access: 'update', functionResource: backend.updatePortfolio });
grantTableAccess({ tableName: 'referrals', access: 'update', functionResource: backend.updateReferralData });
grantTableAccess({ tableName: 'services', access: 'update', functionResource: backend.updateServiceData });
grantTableAccess({ tableName: 'tickets', access: 'readUpdate', functionResource: backend.updateTicketData });
grantTableAccess({ tableName: 'work-orders', access: 'update', functionResource: backend.updateWorkOrderData });

backend.createContactFormLogs.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: ["ses:SendEmail"],
  // The sender comes from business-info, not a hardcoded environment value.
  // Restrict access to SES identities in this deployment's account and region.
  resources: [apiStack.formatArn({
    service: "ses",
    resource: "identity",
    resourceName: "*",
  })],
}));

backend.sendCustomEmail.resources.lambda.addToRolePolicy(new PolicyStatement({
  actions: ["ses:SendEmail"],
  resources: [apiStack.formatArn({
    service: "ses",
    resource: "identity",
    resourceName: "*",
  })],
}));



const routes = [
  { path: '/app/admin/beliefs/batch', method: HttpMethod.PUT, integrationId: 'BatchUpdateBeliefsIntegration', lambda: backend.batchUpdateBeliefs.resources.lambda, protected: true },
  { path: '/app/admin/beliefs/batch/delete', method: HttpMethod.DELETE, integrationId: 'BatchDeleteBeliefsIntegration', lambda: backend.batchDeleteBeliefs.resources.lambda, protected: true },
  { path: '/app/admin/custom-pages/batch', method: HttpMethod.PUT, integrationId: 'BatchUpdateCustomPageIntegration', lambda: backend.batchUpdateCustomPage.resources.lambda, protected: true },
  { path: '/app/admin/custom-pages/batch/delete', method: HttpMethod.DELETE, integrationId: 'BatchDeleteCustomPageIntegration', lambda: backend.batchDeleteCustomPage.resources.lambda, protected: true },
  { path: '/app/admin/faq/batch', method: HttpMethod.PUT, integrationId: 'BatchUpdateFAQIntegration', lambda: backend.batchUpdateFAQ.resources.lambda, protected: true },
  { path: '/app/admin/faq/batch/delete', method: HttpMethod.DELETE, integrationId: 'BatchDeleteFAQIntegration', lambda: backend.batchDeleteFAQ.resources.lambda, protected: true },
  { path: '/app/admin/services/batch', method: HttpMethod.PUT, integrationId: 'BatchUpdateServicesIntegration', lambda: backend.batchUpdateServices.resources.lambda, protected: true },
  { path: '/app/admin/services/batch/delete', method: HttpMethod.DELETE, integrationId: 'BatchDeleteServicesIntegration', lambda: backend.batchDeleteServices.resources.lambda, protected: true },
  { path: '/app/admin/business', method: HttpMethod.POST, integrationId: 'CreateBusinessIntegration', lambda: backend.createBusinessData.resources.lambda, protected: true },
  { path: '/app/admin/business-info', method: HttpMethod.POST, integrationId: 'CreateBusinessInfoIntegration', lambda: backend.createBusinessInfoData.resources.lambda, protected: true },
  { path: '/app/admin/beliefs', method: HttpMethod.POST, integrationId: 'CreateBeliefIntegration', lambda: backend.createBeliefData.resources.lambda, protected: true },
  { path: '/app/admin/sermons', method: HttpMethod.POST, integrationId: 'CreateSermonIntegration', lambda: backend.createSermonData.resources.lambda, protected: true },
  { path: '/app/admin/rentals', method: HttpMethod.POST, integrationId: 'CreateRentalIntegration', lambda: backend.createRentalData.resources.lambda, protected: true },
  { path: '/app/admin/products', method: HttpMethod.POST, integrationId: 'CreateProductIntegration', lambda: backend.createProductData.resources.lambda, protected: true },
  { path: '/app/admin/emails', method: HttpMethod.POST, integrationId: 'CreateEmailIntegration', lambda: backend.createEmailData.resources.lambda, protected: true },
  { path: '/app/admin/emails/send', method: HttpMethod.POST, integrationId: 'SendCustomEmailIntegration', lambda: backend.sendCustomEmail.resources.lambda, protected: true },
  { path: '/app/admin/events', method: HttpMethod.POST, integrationId: 'CreateEventIntegration', lambda: backend.createEventData.resources.lambda, protected: true },
  { path: '/app/admin/clients', method: HttpMethod.POST, integrationId: 'CreateClientIntegration', lambda: backend.createClientData.resources.lambda, protected: true },
  { path: '/public/contact-form-logs', method: HttpMethod.POST, integrationId: 'CreateContactFormLogsIntegration', lambda: backend.createContactFormLogs.resources.lambda, protected: false },
  { path: '/app/admin/custom-pages', method: HttpMethod.POST, integrationId: 'CreateCustomPageIntegration', lambda: backend.createCustomPageData.resources.lambda, protected: true },
  { path: '/app/admin/faq', method: HttpMethod.POST, integrationId: 'CreateFAQIntegration', lambda: backend.createFAQData.resources.lambda, protected: true },
  { path: '/internal/hosting', method: HttpMethod.POST, integrationId: 'CreateHostingIntegration', lambda: backend.createHostingData.resources.lambda, protected: true },
  { path: '/app/messages', method: HttpMethod.POST, integrationId: 'CreateMessageIntegration', lambda: backend.createMessageData.resources.lambda, protected: true },
  { path: '/app/admin/payments', method: HttpMethod.POST, integrationId: 'CreatePaymentIntegration', lambda: backend.createPaymentData.resources.lambda, protected: true },
  { path: '/app/admin/portfolio', method: HttpMethod.POST, integrationId: 'CreatePortfolioIntegration', lambda: backend.createPortfolioData.resources.lambda, protected: true },
  { path: '/app/admin/referrals', method: HttpMethod.POST, integrationId: 'CreateReferralIntegration', lambda: backend.createReferralData.resources.lambda, protected: true },
  { path: '/app/admin/services', method: HttpMethod.POST, integrationId: 'CreateServiceIntegration', lambda: backend.createServiceData.resources.lambda, protected: true },
  { path: '/app/support/tickets', method: HttpMethod.POST, integrationId: 'CreateTicketIntegration', lambda: backend.createTicketData.resources.lambda, protected: true },
  { path: '/app/admin/work-orders', method: HttpMethod.POST, integrationId: 'CreateWorkOrderIntegration', lambda: backend.createWorkOrderData.resources.lambda, protected: true },
  { path: '/app/admin/business/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteBusinessIntegration', lambda: backend.deleteBusinessData.resources.lambda, protected: true },
  { path: '/app/admin/business-info/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteBusinessInfoIntegration', lambda: backend.deleteBusinessInfoData.resources.lambda, protected: true },
  { path: '/app/admin/beliefs/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteBeliefIntegration', lambda: backend.deleteBeliefData.resources.lambda, protected: true },
  { path: '/app/admin/sermons/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteSermonIntegration', lambda: backend.deleteSermonData.resources.lambda, protected: true },
  { path: '/app/admin/rentals/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteRentalIntegration', lambda: backend.deleteRentalData.resources.lambda, protected: true },
  { path: '/app/admin/products/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteProductIntegration', lambda: backend.deleteProductData.resources.lambda, protected: true },
  { path: '/app/admin/events/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteEventIntegration', lambda: backend.deleteEventData.resources.lambda, protected: true },
  { path: '/app/admin/clients/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteClientIntegration', lambda: backend.deleteClientData.resources.lambda, protected: true },
  { path: '/app/admin/contact-form-logs/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteContactFormLogsIntegration', lambda: backend.deleteContactFormLogs.resources.lambda, protected: true },
  { path: '/app/admin/custom-pages/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteCustomPageIntegration', lambda: backend.deleteCustomPage.resources.lambda, protected: true },
  { path: '/app/admin/emails/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteEmailIntegration', lambda: backend.deleteEmailData.resources.lambda, protected: true },
  { path: '/app/admin/faq/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteFAQIntegration', lambda: backend.deleteFAQData.resources.lambda, protected: true },
  { path: '/internal/hosting/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteHostingIntegration', lambda: backend.deleteHostingData.resources.lambda, protected: true },
  { path: '/app/messages/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteMessageIntegration', lambda: backend.deleteMessageData.resources.lambda, protected: true },
  { path: '/app/admin/payments/{id}', method: HttpMethod.DELETE, integrationId: 'DeletePaymentIntegration', lambda: backend.deletePaymentData.resources.lambda, protected: true },
  { path: '/app/admin/referrals/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteReferralIntegration', lambda: backend.deleteReferralData.resources.lambda, protected: true },
  { path: '/app/admin/services/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteServiceDataIntegration', lambda: backend.deleteServiceData.resources.lambda, protected: true },
  { path: '/app/support/tickets/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteTicketIntegration', lambda: backend.deleteTicketData.resources.lambda, protected: true },
  { path: '/app/admin/work-orders/{id}', method: HttpMethod.DELETE, integrationId: 'DeleteWorkOrderIntegration', lambda: backend.deleteWorkOrderData.resources.lambda, protected: true },
  { path: '/app/admin/business', method: HttpMethod.GET, integrationId: 'GetBusinessIntegration', lambda: backend.getBusinessData.resources.lambda, protected: true },
  { path: '/public/business-info/{businessId}', method: HttpMethod.GET, integrationId: 'GetBusinessInfoIntegration', lambda: backend.getBusinessInfoData.resources.lambda, protected: false },
  { path: '/public/beliefs/{businessId}', method: HttpMethod.GET, integrationId: 'GetBeliefIntegration', lambda: backend.getBeliefData.resources.lambda, protected: false },
  { path: '/public/sermons/{businessId}', method: HttpMethod.GET, integrationId: 'GetSermonIntegration', lambda: backend.getSermonData.resources.lambda, protected: false },
  { path: '/public/rentals/{businessId}', method: HttpMethod.GET, integrationId: 'GetRentalIntegration', lambda: backend.getRentalData.resources.lambda, protected: false },
  { path: '/public/products/{businessId}', method: HttpMethod.GET, integrationId: 'GetProductIntegration', lambda: backend.getProductData.resources.lambda, protected: false },
  { path: '/public/events/{businessId}', method: HttpMethod.GET, integrationId: 'GetEventIntegration', lambda: backend.getEventData.resources.lambda, protected: false },
  { path: '/app/admin/clients', method: HttpMethod.GET, integrationId: 'GetClientIntegration', lambda: backend.getClientData.resources.lambda, protected: true },
  { path: '/app/admin/clients/{id}', method: HttpMethod.GET, integrationId: 'GetClientByIdIntegration', lambda: backend.getClientById.resources.lambda, protected: true },
  { path: '/app/admin/contact-form-logs', method: HttpMethod.GET, integrationId: 'GetContactFormLogsIntegration', lambda: backend.getContactFormLogs.resources.lambda, protected: true },
  { path: '/public/custom-pages/{businessId}', method: HttpMethod.GET, integrationId: 'GetCustomPageIntegration', lambda: backend.getCustomPageData.resources.lambda, protected: false },
  { path: '/app/admin/emails', method: HttpMethod.GET, integrationId: 'GetEmailIntegration', lambda: backend.getEmailData.resources.lambda, protected: true },
  { path: '/app/admin/emails/count', method: HttpMethod.GET, integrationId: 'GetEmailSubscriberCountIntegration', lambda: backend.getEmailSubscriberCount.resources.lambda, protected: true },
  { path: '/public/faq/{businessId}', method: HttpMethod.GET, integrationId: 'GetFAQIntegration', lambda: backend.getFAQData.resources.lambda, protected: false },
  { path: '/internal/hosting', method: HttpMethod.GET, integrationId: 'GetHostingIntegration', lambda: backend.getHostingData.resources.lambda, protected: true },
  { path: '/app/messages', method: HttpMethod.GET, integrationId: 'GetMessageIntegration', lambda: backend.getMessageData.resources.lambda, protected: true },
  { path: '/app/messages/{chatId}', method: HttpMethod.GET, integrationId: 'GetMessagesByChatIdIntegration', lambda: backend.getMessagesByChatId.resources.lambda, protected: true },
  { path: '/app/admin/payments', method: HttpMethod.GET, integrationId: 'GetPaymentIntegration', lambda: backend.getPaymentData.resources.lambda, protected: true },
  { path: '/app/admin/business-metrics/{id}', method: HttpMethod.GET, integrationId: 'GetBusinessMetricIntegration', lambda: backend.getBusinessMetricData.resources.lambda, protected: true },
  { path: '/app/files/presign', method: HttpMethod.POST, integrationId: 'GetPresignURLIntegration', lambda: backend.getPresignURL.resources.lambda, protected: true },
  { path: '/app/admin/referrals', method: HttpMethod.GET, integrationId: 'GetReferralIntegration', lambda: backend.getReferralData.resources.lambda, protected: true },
  { path: '/public/services/{businessId}', method: HttpMethod.GET, integrationId: 'GetServiceIntegration', lambda: backend.getServiceData.resources.lambda, protected: false },
  { path: '/app/support/tickets', method: HttpMethod.GET, integrationId: 'GetTicketIntegration', lambda: backend.getTicketData.resources.lambda, protected: true },
  { path: '/app/support/tickets/{id}', method: HttpMethod.GET, integrationId: 'GetTicketByIdIntegration', lambda: backend.getTicketById.resources.lambda, protected: true },
  { path: '/app/support/tickets/user/{userId}', method: HttpMethod.GET, integrationId: 'GetTicketsByUserIdIntegration', lambda: backend.getTicketsByUserId.resources.lambda, protected: true },
  { path: '/app/support/tickets/working', method: HttpMethod.GET, integrationId: 'GetWorkingTicketIntegration', lambda: backend.getWorkingTicketData.resources.lambda, protected: true },
  { path: '/app/admin/work-orders', method: HttpMethod.GET, integrationId: 'GetWorkOrderIntegration', lambda: backend.getWorkOrderData.resources.lambda, protected: true },
  { path: '/app/admin/business', method: HttpMethod.PUT, integrationId: 'UpdateBusinessIntegration', lambda: backend.updateBusinessData.resources.lambda, protected: true },
  { path: '/app/admin/business-info', method: HttpMethod.PUT, integrationId: 'UpdateBusinessInfoIntegration', lambda: backend.updateBusinessInfoData.resources.lambda, protected: true },
  { path: '/app/admin/beliefs', method: HttpMethod.PUT, integrationId: 'UpdateBeliefIntegration', lambda: backend.updateBeliefData.resources.lambda, protected: true },
  { path: '/app/admin/sermons', method: HttpMethod.PUT, integrationId: 'UpdateSermonIntegration', lambda: backend.updateSermonData.resources.lambda, protected: true },
  { path: '/app/admin/rentals', method: HttpMethod.PUT, integrationId: 'UpdateRentalIntegration', lambda: backend.updateRentalData.resources.lambda, protected: true },
  { path: '/app/admin/products', method: HttpMethod.PUT, integrationId: 'UpdateProductIntegration', lambda: backend.updateProductData.resources.lambda, protected: true },
  { path: '/app/admin/emails', method: HttpMethod.PUT, integrationId: 'UpdateEmailIntegration', lambda: backend.updateEmailData.resources.lambda, protected: true },
  { path: '/app/admin/events', method: HttpMethod.PUT, integrationId: 'UpdateEventIntegration', lambda: backend.updateEventData.resources.lambda, protected: true },
  { path: '/app/admin/clients', method: HttpMethod.PUT, integrationId: 'UpdateClientIntegration', lambda: backend.updateClientData.resources.lambda, protected: true },
  { path: '/app/admin/contact-form-logs', method: HttpMethod.PUT, integrationId: 'UpdateContactFormLogsIntegration', lambda: backend.updateContactFormLogs.resources.lambda, protected: true },
  { path: '/app/admin/custom-pages', method: HttpMethod.PUT, integrationId: 'UpdateCustomPageIntegration', lambda: backend.updateCustomPageData.resources.lambda, protected: true },
  { path: '/app/admin/faq', method: HttpMethod.PUT, integrationId: 'UpdateFAQIntegration', lambda: backend.updateFAQData.resources.lambda, protected: true },
  { path: '/internal/hosting', method: HttpMethod.PUT, integrationId: 'UpdateHostingIntegration', lambda: backend.updateHostingData.resources.lambda, protected: true },
  { path: '/app/messages', method: HttpMethod.PUT, integrationId: 'UpdateMessageIntegration', lambda: backend.updateMessageData.resources.lambda, protected: true },
  { path: '/app/admin/payments', method: HttpMethod.PUT, integrationId: 'UpdatePaymentIntegration', lambda: backend.updatePaymentData.resources.lambda, protected: true },
  { path: '/app/admin/portfolio', method: HttpMethod.PUT, integrationId: 'UpdatePortfolioIntegration', lambda: backend.updatePortfolio.resources.lambda, protected: true },
  { path: '/app/admin/referrals', method: HttpMethod.PUT, integrationId: 'UpdateReferralIntegration', lambda: backend.updateReferralData.resources.lambda, protected: true },
  { path: '/app/admin/services', method: HttpMethod.PUT, integrationId: 'UpdateServiceIntegration', lambda: backend.updateServiceData.resources.lambda, protected: true },
  { path: '/app/support/tickets', method: HttpMethod.PUT, integrationId: 'UpdateTicketIntegration', lambda: backend.updateTicketData.resources.lambda, protected: true },
  { path: '/app/admin/work-orders', method: HttpMethod.PUT, integrationId: 'UpdateWorkOrderIntegration', lambda: backend.updateWorkOrderData.resources.lambda, protected: true },
  ...getBusinessRoutes(backend),
]

addApiRoutes({
  httpApi,
  jwtAuthorizer,
  routes
})

backend.addOutput({
  custom: {
    API: {
      endpoint: httpApi.url ?? "",
    },
  },
});

if (monitoringEnabled) {
  addMonitoring(backend.createStack("monitoring-stack"), {
    environment: deploymentEnvironment,
    alertEmail: process.env.MONITORING_ALERT_EMAIL?.trim() || applicationConfig.supportEmail,
    api: httpApi,
    criticalFunctions: {
      CreateStripeSession: backend.createStripeSession.resources.lambda,
      GetStripeSession: backend.getStripeSession.resources.lambda,
      ManageSubscriptions: backend.manageSubscriptions.resources.lambda,
      CreatePayment: backend.createPaymentData.resources.lambda,
      UpdatePayment: backend.updatePaymentData.resources.lambda,
      BillingNotifications: backend.billingNotifications.resources.lambda,
      SendCustomEmail: backend.sendCustomEmail.resources.lambda,
      CreateContact: backend.createContactFormLogs.resources.lambda,
      CreateTicket: backend.createTicketData.resources.lambda,
      CreateMessage: backend.createMessageData.resources.lambda,
      AdminCreateUser: backend.adminCreateUser.resources.lambda,
      ...(stripeResources ? { StripeWebhook: backend.stripeWebhook.resources.lambda } : {}),
    },
    billing: { function: backend.billingNotifications.resources.lambda, mappings: billingResources.mappings },
  });
}

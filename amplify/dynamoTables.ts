type SecondaryIndexConfig = {
  indexName: string;
  partitionKey: string;
  sortKey: string;
  sortKeyType?: "string" | "number";
};

type TableConfig = {
  constructId: string;
  tableName: string;
  partitionKey: string;
  sortKey: string;
  globalSecondaryIndexes?: SecondaryIndexConfig[];
};

export const tableConfigs: TableConfig[] = [
  { constructId: "BillingNotificationsTable", tableName: "billing-notifications", partitionKey: "businessId", sortKey: "id" },
  { constructId: "SubscriptionStateTable", tableName: "subscription-state", partitionKey: "businessId", sortKey: "id" },
  {
    constructId: "BusinessesTable",
    tableName: "businesses",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "BusinessInfoTable",
    tableName: "business-info",
    partitionKey: "businessId",
    sortKey: "id",
  },  {
    constructId: "BeliefsTable",
    tableName: "beliefs",
    partitionKey: "businessId",
    sortKey: "id",
  },  {
    constructId: "SermonsTable",
    tableName: "sermons",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "RentalsTable",
    tableName: "rentals",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "ProductsTable",
    tableName: "products",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "EventsTable",
    tableName: "events",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "ClientsTable",
    tableName: "clients",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "ContactFormLogsTable",
    tableName: "contact-form-logs",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "CustomPagesTable",
    tableName: "customPages",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "EmailsTable",
    tableName: "emails",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "FaqsTable",
    tableName: "faq",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "ProjectsTable",
    tableName: "projects",
    partitionKey: "businessId",
    sortKey: "id",
    globalSecondaryIndexes: [
      { indexName: "clientIDIndex", partitionKey: "businessId", sortKey: "clientId" },
    ],
  },
  {
    constructId: "HostingTable",
    tableName: "hosting",
    partitionKey: "businessId",
    sortKey: "id",
    globalSecondaryIndexes: [
      { indexName: "clientIDIndex", partitionKey: "businessId", sortKey: "clientId" },
    ],
  },
  {
    constructId: "MessagesTable",
    tableName: "messages",
    partitionKey: "businessId",
    sortKey: "id",
    globalSecondaryIndexes: [
      { indexName: "chatIDIndex", partitionKey: "businessId", sortKey: "chatId" },
    ],
  },
  {
    constructId: "PaymentsTable",
    tableName: "payments",
    partitionKey: "businessId",
    sortKey: "id",
    globalSecondaryIndexes: [
      { indexName: "clientIDIndex", partitionKey: "businessId", sortKey: "clientId" },
    ],
  },
  {
    constructId: "BusinessMetricsTable",
    tableName: "business-metrics",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "PortfolioTable",
    tableName: "portfolio",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "ReferralsTable",
    tableName: "referrals",
    partitionKey: "businessId",
    sortKey: "id",
    globalSecondaryIndexes: [
      { indexName: "clientIDIndex", partitionKey: "businessId", sortKey: "referredBy" },
    ],
  },
  {
    constructId: "ServicesTable",
    tableName: "services",
    partitionKey: "businessId",
    sortKey: "id",
  },
  {
    constructId: "TicketsTable",
    tableName: "tickets",
    partitionKey: "businessId",
    sortKey: "id",
    globalSecondaryIndexes: [
      { indexName: "createdByIDIndex", partitionKey: "businessId", sortKey: "createdById" },
      {
        indexName: "businessIDDateCreatedIndex",
        partitionKey: "businessId",
        sortKey: "dateCreated",
        sortKeyType: "number",
      },
    ],
  },
  {
    constructId: "WorkOrdersTable",
    tableName: "work-orders",
    partitionKey: "businessId",
    sortKey: "id",
  },
];

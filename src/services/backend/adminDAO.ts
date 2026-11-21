import { validateCreateItem } from "../../../shared/create-validation";
import axios, { type AxiosResponse } from "axios";
import api from "./axios";
import type {
  AboutSectionData,
  ClientData,
  FAQSectionData,
  HostingData,
  EmailData,
  MessageData,
  MetaData,
  PaymentData,
  PortfolioData,
  ProductData,
  ProjectData,
  ReferralData,
  RentalData,
  ServiceData,
  Status,
  Submission,
  TicketData,
  WorkOrderData,
  MetricData,
  SendEmailRequest,
} from "../../types/daoTypes";

type ApiEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  results: T[];
  result?: T;
  nextToken?: string;
  [key: string]: unknown;
};

type CreatedCognitoUser = {
  Username?: string;
  Sub?: string;
};

type PresignedFile = {
  id: string;
  uploadUrl: string;
  key: string;
  fileUrl: string;
};

const businessId = import.meta.env.VITE_APP_BUSINESS_ID;
const platformStatusURL = import.meta.env.VITE_APP_PLATFORM_STATUS_URL;

function requireBusinessId(): string {
  if (!businessId) throw new Error("VITE_APP_BUSINESS_ID is not configured.");
  return businessId;
}

function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

function apiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) return new Error(message);
  }
  return error instanceof Error ? error : new Error("An unexpected API error occurred.");
}

async function checked<T = unknown>(
  request: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<AxiosResponse<ApiEnvelope<T>>> {
  try {
    const response = await request;
    if (!response.data.success) {
      throw new Error(response.data.message || "The API request was not successful.");
    }
    return response;
  } catch (error: unknown) {
    throw apiError(error);
  }
}

async function getAll<T>(path: string): Promise<AxiosResponse<ApiEnvelope<T>>> {
  let nextToken: string | undefined;
  let lastResponse: AxiosResponse<ApiEnvelope<T>> | undefined;
  const results: T[] = [];

  do {
    lastResponse = await checked<T>(api.get(path, {
      params: nextToken ? { nextToken } : undefined,
    }));
    results.push(...(lastResponse.data.results ?? []));
    nextToken = lastResponse.data.nextToken;
  } while (nextToken);

  if (!lastResponse) throw new Error("The API returned no response.");
  lastResponse.data.results = results;
  lastResponse.data.nextToken = undefined;
  return lastResponse;
}

function getPublicCollection<T>(resource: string) {
  return getAll<T>(`/public/${resource}/${pathSegment(requireBusinessId())}`);
}

function getProtectedCollection<T>(path: string) {
  return getAll<T>(path);
}

function createProtected<T>(
  path: string,
  item: T,
): Promise<AxiosResponse<ApiEnvelope<T>>> {
  return checked<T>(api.post<ApiEnvelope<T>>(path, { item }));
}

function updateProtected(path: string, id: string, updates: Record<string, unknown>) {
  return checked(api.put(path, { id, updates }));
}

function deleteProtected(path: string, id: string) {
  return checked(api.delete(`${path}/${pathSegment(id)}`));
}

function saveBatch<T>(path: string, itemsToSave: T[], idsToDelete: string[]) {
  return checked(api.put(`${path}/batch`, { itemsToSave, idsToDelete }));
}

function deleteBatch(path: string, ids: string[]) {
  return checked(api.delete(`${path}/batch/delete`, { data: { ids } }));
}

function filterResults<T>(
  response: AxiosResponse<ApiEnvelope<T>>,
  predicate: (item: T) => boolean,
) {
  response.data.results = (response.data.results ?? []).filter(predicate);
  return response;
}

export const fetchPlatformStatus = async (): Promise<{
  platformStatus: Status;
  lastUpdated?: number;
}> => {
  if (!platformStatusURL) throw new Error("VITE_APP_PLATFORM_STATUS_URL is not configured.");
  const response = await fetch(platformStatusURL, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch platform status.");
  return response.json() as Promise<{ platformStatus: Status; lastUpdated?: number }>;
};

export const updatePlatformStatus = (status: Status) =>
  checked(api.post("/internal/platform/status", { platformStatus: status }))
    .then(({ data }) => data);

export const getBusinessInfo = async () => {
  const response = await getPublicCollection("business-info");
  response.data.result = response.data.results[0];
  return response;
};
export const updateBusinessInfo = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/business-info", id, updates);

export const getClients = () => getProtectedCollection<ClientData>("/app/admin/clients");
export const getClientById = (clientId: string) =>
  getProtectedCollection<ClientData>(`/app/admin/clients/${pathSegment(clientId)}`);
export const createClient = async (client: ClientData) => {
  try {
    validateCreateItem("clients", client);
    const userResponse = await checked(api.post("/internal/users", {
      email: client.email,
      groupName: "Client",
    }));
    const user = userResponse.data.user as CreatedCognitoUser | undefined;
    const userId = user?.Sub ?? user?.Username;
    if (!userId) throw new Error("Cognito did not return a user ID.");
    client.id = userId
    return createProtected("/app/admin/clients", { ...client, id: userId });
  } catch (error: unknown) {
    throw apiError(error);
  }
};
export const updateClient = (updates: Record<string, unknown>, id: string, ) =>
  updateProtected("/app/admin/clients", id, updates);

export const getProjects = () => getProtectedCollection<ProjectData>("/app/projects");
export const getProjectsByClientId = async (clientId: string) =>
  filterResults(await getProjects(), (project) => project.clientId === clientId);
export const createProject = (project: ProjectData) =>
  createProtected("/app/admin/projects", project);
export const updateProject = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/projects", id, updates);

export const getPayments = () => getProtectedCollection<PaymentData>("/app/admin/payments");
export const getPaymentsById = (clientId: string) =>
  getProtectedCollection<PaymentData>(`/app/admin/payments/client/${pathSegment(clientId)}`);
export const createPayment = (payment: PaymentData) =>
  createProtected("/app/admin/payments", payment);
export const updatePayment = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/payments", id, updates);
export const deletePayment = (id: string) =>
  deleteProtected("/app/admin/payments", id);

export const getReferrals = () =>
  getProtectedCollection<ReferralData>("/app/admin/referrals");
export const getReferralsById = (clientId: string) =>
  getProtectedCollection<ReferralData>(`/app/admin/referrals/client/${pathSegment(clientId)}`);
export const createReferral = (referral: ReferralData) =>
  createProtected("/app/admin/referrals", referral);

export const getServices = () => getPublicCollection<ServiceData>("services");
export const createService = (service: ServiceData) =>
  createProtected("/app/admin/services", service);
export const updateService = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/services", id, updates);
export const deleteService = (id: string) =>
  deleteProtected("/app/admin/services", id);
export const uploadServices = (itemsToSave: ServiceData[], idsToDelete: string[]) =>
  saveBatch("/app/admin/services", itemsToSave, idsToDelete);

export const getRentals = () => getPublicCollection<RentalData>("rentals");
export const createRental = (rental: RentalData) =>
  createProtected("/app/admin/rentals", rental);
export const updateRental = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/rentals", id, updates);
export const deleteRental = (id: string) =>
  deleteProtected("/app/admin/rentals", id);

export const getProducts = () => getPublicCollection<ProductData>("products");
export const createProduct = (product: ProductData) =>
  createProtected("/app/admin/products", product);
export const updateProduct = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/products", id, updates);
export const deleteProduct = (id: string) =>
  deleteProtected("/app/admin/products", id);

export const getEmails = () => getProtectedCollection<EmailData>("/app/admin/emails");
export const sendCustomEmail = (email : SendEmailRequest) =>
  checked(api.post("/app/admin/emails/send", {email}));
export const createEmail = (email: EmailData) =>
  createProtected("/app/admin/emails", email);
export const updateEmail = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/emails", id, updates);
export const deleteEmail = (id: string) =>
  deleteProtected("/app/admin/emails", id);

export const getFAQ = () => getPublicCollection<FAQSectionData>("faq");
export const createFAQSection = (faqSection: FAQSectionData) =>
  createProtected("/app/admin/faq", faqSection);
export const updateFAQSection = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/faq", id, updates);
export const deleteFAQSection = (id: string) =>
  deleteProtected("/app/admin/faq", id);
export const uploadFAQSections = (itemsToSave: FAQSectionData[], idsToDelete: string[]) =>
  saveBatch("/app/admin/faq", itemsToSave, idsToDelete);

// The UI still calls these "About" methods; their backend domain is custom-pages.
export const getAbout = () => getPublicCollection<AboutSectionData>("custom-pages");
export const createAboutSection = (section: AboutSectionData) =>
  createProtected("/app/admin/custom-pages", section);
export const updateAboutSection = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/custom-pages", id, updates);
export const deleteAboutSection = (id: string) =>
  deleteProtected("/app/admin/custom-pages", id);
export const uploadAboutSections = (itemsToSave: AboutSectionData[], idsToDelete: string[]) =>
  saveBatch("/app/admin/custom-pages", itemsToSave, idsToDelete);
export const deleteAboutSections = (ids: string[]) =>
  deleteBatch("/app/admin/custom-pages", ids);

export const getPortfolio = () => getPublicCollection<PortfolioData>("portfolio");
export const createPortfolio = (portfolio: PortfolioData) =>
  createProtected("/app/admin/portfolio", portfolio);
export const updatePortfolio = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/portfolio", id, updates);
export const deletePortfolio = (id: string) =>
  deleteProtected("/app/admin/portfolio", id);

export const getWorkOrders = () =>
  getProtectedCollection<WorkOrderData>("/app/admin/work-orders");
export const createWorkOrder = (workOrder: WorkOrderData) =>
  createProtected("/app/admin/work-orders", workOrder);
export const updateWorkOrder = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/admin/work-orders", id, updates);
export const deleteWorkOrder = (id: string) =>
  deleteProtected("/app/admin/work-orders", id);

export const createContactSubmission = (submission: Submission) =>
  checked(api.post("/public/contact-form-logs", {
    businessId: requireBusinessId(),
    item: submission,
    turnstileToken: (submission as Submission & { turnstileToken?: string }).turnstileToken,
  }));
export const getContactSubmissions = () =>
  getProtectedCollection<Submission>("/app/admin/contact-form-logs");
export const deleteContactSubmission = (id: string) =>
  deleteProtected("/app/admin/contact-form-logs", id);

export const uploadAboutImages = (files: Array<{ id: string; type: string; size: number }>) =>
  checked<PresignedFile>(api.post("/app/files/presign", { category: "about", files }));

export const getHosting = () => getProtectedCollection<HostingData>("/internal/hosting");
export const getBusinessMetrics = (id:string) => getProtectedCollection<MetricData>(`/app/admin/business-metrics/${pathSegment(id)}`)
export const getHostingById = async (clientId: string) =>
  filterResults(await getHosting(), (hosting) => hosting.clientId === clientId);
export const createHosting = (hosting: HostingData) =>
  createProtected("/internal/hosting", hosting);
export const updateHosting = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/internal/hosting", id, updates);

export const getWorkingTickets = () =>
  getProtectedCollection<TicketData>("/app/support/tickets/working");
export const getTicketById = (ticketId: string) =>
  checked<TicketData>(api.get(`/app/support/tickets/${pathSegment(ticketId)}`));
export const getTicketsById = (userId: string) =>
  getProtectedCollection<TicketData>(`/app/support/tickets/user/${pathSegment(userId)}`);
export const createTicket = (ticket: TicketData) =>
  createProtected<TicketData>("/app/support/tickets", ticket);
export const updateTicket = (updates: Record<string, unknown>, id: string) =>
  updateProtected("/app/support/tickets", id, updates);
export const getTicketsAfterDate = (lastFetched: number) => {
  if (!Number.isSafeInteger(lastFetched) || lastFetched < 0) {
    throw new Error("lastFetched must be a non-negative integer timestamp.");
  }
  return getProtectedCollection<TicketData>(
    `/app/support/tickets/after/${lastFetched}`,
  );
};

export const createMessage = (message: MessageData) =>
  createProtected("/app/messages", message);
export const getTicketMessages = (ticketId: string) =>
  getProtectedCollection<MessageData>(`/app/messages/${pathSegment(ticketId)}`);

export const getTicketMetadata = (id: string) =>
  checked<MetaData>(api.get(`/app/support/tickets/metadata/${pathSegment(id)}`));
export const updateTicketMetadata = (id: string, updates: Record<string, unknown>) =>
  updateProtected("/app/support/tickets", id, updates);


import { siteConfig } from "../config/site";
// services/adminService.ts
import {
  createClient as daoCreateUser,
  getClients as daoGetClients,
  getProjects as daoGetProjects,
  createProject as daoCreateProject,
  getPayments as daoGetPayments,
  createPayment as daoCreatePayment,
  updatePayment as daoUpdatePayment,
  deletePayment as daoDeletePayment,
  getPaymentsById as daoGetPaymentsById,
  getProjectsByClientId as daoGetProjectsByClientId,
  getWorkingTickets as daoGetWorkingTickets,
  getTicketById as daoGetTicketById,
  createTicket as daoCreateTicket,
  createMessage as daoCreateMessage,
  createReferral as daoCreateReferral,
  getTicketMessages as daoGetTicketMessages,
  getTicketsById as daoGetTicketsById, 
  updateHosting as daoUpdateHosting,
  getHosting as daoGetHosting,
  getHostingById as daoGetHostingById,
  createHosting as daoCreateHosting,
  updateTicket as daoUpdateTicket,
  updateAboutSection as daoUpdateAboutSection,
  updateService as daoUpdateService,
  updateProject as daoUpdateProject,
  updateClient as daoUpdateClient,
  getTicketMetadata as daoGetTicketMetadata,
  getReferrals as daoGetReferrals,
  getReferralsById as daoGetReferralsById,
  getTicketsAfterDate as daoGetTicketsAfterDate,
  getServices as daoGetServices,
  getAbout as daoGetAbout,
  createAboutSection as daoCreateAboutSection,
  createService as daoCreateService,
  updateTicketMetadata as daoUpdateTicketMetadata,
  deleteAboutSection as daoDeleteAboutSection,
  deleteService as daoDeleteService,
  uploadAboutImages as daoUploadAboutImages,
  uploadAboutSections as daoUploadAboutSections,
  deleteAboutSections as daoDeleteAboutSections,
  createFAQSection as daoCreateFAQSection,
  getFAQ as daoGetFAQ,
  updateFAQSection as daoUpdateFAQSection,
  deleteFAQSection as daoDeleteFAQSection,
  uploadFAQSections as daoUploadFAQSections,
  uploadServices as daoUploadServices,
  getWorkOrders as daoGetWorkOrders,
  getPortfolio as daoGetPortfolio,
  deletePortfolio as daoDeletePortfolio,
  deleteWorkOrder as daoDeleteWorkOrder,
  updatePortfolio as daoUpdatePortfolio,
  updateWorkOrder as daoUpdateWorkOrder,
  createPortfolio as daoCreatePortfolio,
  createWorkOrder as daoCreateWorkOrder,
  createContactSubmission as daoCreateContactSubmission,
  getContactSubmissions as daoGetContactSubmission,
  deleteContactSubmission as daoDeleteContactSubmission,
  updateBusinessInfo as daoUpdateBusinessInfo,
  getBusinessInfo as daoGetBusienssInfo,
  fetchPlatformStatus as daoFetchPaltformStatus,
  updatePlatformStatus as daoUpdatePlatformStatus,
  getBusinessMetrics as daoGetBusinessMetrics,
  getClientById as daoGetClientById,
  sendCustomEmail
} from "./backend/adminDAO";
import type { ClientData, ProjectData, PageOrFeature, PaymentData, PaymentItemData, TicketData, FormAndUserData, MessageData, CreateMessageData, MetaData, ReferralData, HostingData, ServiceData, AboutSectionData, FAQSectionData, PortfolioData, WorkOrderData, Submission, BusinessInfoData, Status, MetricData, SendEmailRequest } from "../types/daoTypes";
import { v4 as uuidv4 } from "uuid";
import { HttpStatusCode } from "axios";
import {
  createClientTicketResponseEmailHtml,
  createTicketCreatedEmailHtml,
  createTicketResponseEmailHtml,
} from "../utils/emailHtml";
import logger from "../utils/logger";

const businessId = import.meta.env.VITE_APP_BUSINESS_ID!;
const userPool = import.meta.env.VITE_APP_USER_POOL;
const supportEmail = siteConfig.supportEmail;

async function sendTicketEmail(email: SendEmailRequest): Promise<void> {
  try {
    await sendCustomEmail(email);
  } catch (error) {
    logger.error("Ticket notification email failed", error);
  }
}

const adminService = {

  async getPayments() {
    try {
      const results = await daoGetPayments();
      if (results?.data.results.length > 0) {
        return results?.data.results as PaymentData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async getMetricData(id: string){
    try{
      const results = await daoGetBusinessMetrics(id)
      if(results?.data.results.length === 1){
        return results?.data.results[0] as MetricData
      }else{
        return null
      }
    }catch(err){
      return Promise.reject(err)
    }
  }, 
  async getBusinessInfo(){
    try{
      const results = await daoGetBusienssInfo();
      if(results?.data.result){
        return results.data.result as BusinessInfoData
      }else{
        return null;
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getReferrals(){
    try{
      const results = await daoGetReferrals();
      if (results?.data.results.length > 0) {
        return results?.data.results as ReferralData[];
      } else {
        return [];
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getContactSubmissions(){
    try{
      const results = await daoGetContactSubmission();
      if (results?.data.results.length > 0) {
        return results?.data.results as Submission[];
      } else {
        return [];
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getReferralsById(clientId: string) {
    try {
      const results = await daoGetReferralsById(clientId);
      if (results?.data.results.length > 0) {
        return results?.data.results as ReferralData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async getPaymentsById(clientId: string) {
    try {
      const results = await daoGetPaymentsById(clientId);
      if (results?.data.results.length > 0) {
        return results?.data.results as PaymentData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async fetchPlatformStatus(){
    try{
      const results = await daoFetchPaltformStatus();
      return results.platformStatus;
    }catch(err){
      return Promise.reject(err);
    }
  },

  async createPayment(payment:FormData) {
    try {
      const rawItems = payment.get("items");
      if (typeof rawItems !== "string") {
        throw new Error("Payment items are required.");
      }

      const parsedItems: unknown = JSON.parse(rawItems);
      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        throw new Error("At least one payment item is required.");
      }

      const items: PaymentItemData[] = parsedItems.map((paymentItem) => {
        if (
          typeof paymentItem !== "object" ||
          paymentItem === null ||
          typeof paymentItem.id !== "string" ||
          !paymentItem.id.trim() ||
          typeof paymentItem.item !== "string" ||
          !paymentItem.item.trim() ||
          typeof paymentItem.unitPrice !== "number" ||
          !Number.isFinite(paymentItem.unitPrice) ||
          paymentItem.unitPrice < 0 ||
          typeof paymentItem.quantity !== "number" ||
          !Number.isSafeInteger(paymentItem.quantity) ||
          paymentItem.quantity < 1
        ) {
          throw new Error("Each payment item requires a name, a valid unit price, and a positive whole-number quantity.");
        }

        return {
          pricingMode: paymentItem.pricingMode,
          stripeProductId: paymentItem.stripeProductId,
          stripePriceId: paymentItem.stripePriceId,
          id: paymentItem.id,
          item: paymentItem.item.trim(),
          unitPrice: Math.round(paymentItem.unitPrice * 100) / 100,
          quantity: paymentItem.quantity,
        };
      });

      const amount = Math.round(
        items.reduce(
          (total, paymentItem) =>
            total + paymentItem.unitPrice * paymentItem.quantity,
          0,
        ) * 100,
      ) / 100;

      const newPayment: PaymentData = {
        id: uuidv4(),
        amount,
        billingMode: payment.get("billingMode") === "subscription" ? "subscription" : "payment",
        businessId,
        status: "Pending",
        clientId: payment.get("clientId")?.toString()!,
        items,
        date: new Date(payment.get("date")?.toString()!).getTime(),
        platform: payment.get("platform")?.toString()! as "Zelle" | "PayPal" | "Stripe"
      };

      const created = await daoCreatePayment(newPayment);
      if (created.status === HttpStatusCode.Ok) {
        return created.data.result as PaymentData;
      } else {
        return null;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async updatePayment(
    originalPayment: PaymentData,
    newPayment: PaymentData,
  ) {
    try {
      const updates: Record<string, unknown> = {};
      const editableFields: Array<keyof PaymentData> = [
        "clientId",
        "date",
        "items",
        "status",
        "platform",
      ];

      for (const key of editableFields) {
        const originalValue = originalPayment[key];
        const newValue = newPayment[key];
        const valuesMatch = key === "items"
          ? JSON.stringify(originalValue) === JSON.stringify(newValue)
          : originalValue === newValue;

        if (!valuesMatch && newValue !== undefined) {
          updates[key] = newValue;
        }
      }

      if (Object.keys(updates).length === 0) return originalPayment;

      const results = await daoUpdatePayment(updates, originalPayment.id);
      if (!results?.data.success) {
        return Promise.reject(
          results?.data.message || "There was an issue updating the payment",
        );
      }

      return results.data.result as PaymentData;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async deletePayment(id: string) {
    try {
      const results = await daoDeletePayment(id);
      if (!results?.data.success) {
        return Promise.reject(
          results?.data.message || "There was an issue deleting the payment",
        );
      }
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async createAboutSection(section: FormAndUserData){
    try{
      const id = uuidv4();
      const aboutSectionData: AboutSectionData = {
        id,
        index: Number(section.formData.get("index")) || 0,
        title: section.formData.get("title")?.toString() || "",
        columns: Number(section.formData.get("columns")) as 1 | 2 | 3,
        rows: Number(section.formData.get("rows")) as 1 | 2 | 3,
        isCard: section.formData.has("isCard"),
        cardType: section.formData.get("cardType")?.toString() as "icon" | "image",
        backgroundColor: section.formData.get("backgroundColor")?.toString()!,
        blocks: JSON.parse(section.formData.get("blocks")?.toString()!)
      }

      const created = (await daoCreateAboutSection(aboutSectionData)).status === HttpStatusCode.Ok

      if(created){
        return aboutSectionData
      }else{
        return null
      }
    }catch(err){
      return Promise.reject(err);
    }
  }, 
  async createContactSubmission(contactSubmission: FormData){
    try{
      const id = uuidv4();
      const submission: Submission = contactSubmission.get("type")?.toString() === "contact" 
      ? {
      id,
      type: "contact",
      name: contactSubmission.get("name")?.toString()!,
      email: contactSubmission.get("email")?.toString()!,
      phone: contactSubmission.get("phone")?.toString()!,
      company: contactSubmission.get("company")?.toString()!,
      subject: contactSubmission.get("subject")?.toString()!,
      message: contactSubmission.get("message")?.toString()!,
      submittedAt: Date.now(),
      turnstileToken: (contactSubmission.get("turnstileToken") ?? contactSubmission.get("cf-turnstile-response"))?.toString() || ""
      } : {
        id,
        type: 'consultation',
        name: contactSubmission.get("name")?.toString()!,
        email: contactSubmission.get("email")?.toString()!,
        phone: contactSubmission.get("phone")?.toString()!,
        company: contactSubmission.get("company")?.toString()!,
        projectType: contactSubmission.get("projectType")?.toString()!,
        budget: contactSubmission.get("budget")?.toString()!,
        timeline: contactSubmission.get("timeline")?.toString()!,
        description: contactSubmission.get("description")?.toString()!,
        submittedAt: new Date().getTime(),
        turnstileToken: (contactSubmission.get("turnstileToken") ?? contactSubmission.get("cf-turnstile-response"))?.toString() || ""
      }

      const results = await daoCreateContactSubmission(submission);
      const created = results.status as number === HttpStatusCode.Ok

      if(created){
        return {message: results.data.message, success: true,};
      }else{
        return {message: results.data.message, success: false};
      }
    }catch(err){
      return Promise.reject(err);
    }
  }, 
    async createPortfolio(portfolio: PortfolioData){
    try{
      // const portfolioData: PortfolioData = {
      //   id: portfolio.get("id")?.toString()!,
      //   title: portfolio.get("title")?.toString()!,
      //   category: portfolio.get("category")?.toString()!,
      //   description: portfolio.get("description")?.toString()!,
      //   website: portfolio.get("website")?.toString()!,
      //   imageUrl: portfolio.get("imageUrl")?.toString()!
      // }

      const created = (await daoCreatePortfolio(portfolio)).status === HttpStatusCode.Ok

      if(created){
        return portfolio
      }else{
        return null
      }
    }catch(err){
      return Promise.reject(err);
    }
  },   
  async createWorkOrder(workOrder: WorkOrderData){
    try{
      const id = uuidv4();
      workOrder.id = id;
      // const workOrderData: WorkOrderData = {
      //   id,
      //   description: workOrder.formData.get("description")?.toString()!,
      //   clientName: workOrder.formData.get("clientName")?.toString()!,
      //   tasks: [],
      //   createdAt: Number(workOrder.formData.get("createdAt")),
      //   urgency: workOrder.formData.get("description")?.toString()! as "low" | "medium" | "high" | "urgent",
      //   expectedCompletion: Number(workOrder.formData.get("expectedCompletion"))
      // }

      const created = (await daoCreateWorkOrder(workOrder)).status === HttpStatusCode.Ok

      if(created){
        return workOrder;
      }else{
        return null
      }
    }catch(err){
      return Promise.reject(err);
    }
  }, 
  async uploadImages(files: Array<{id: string, type: string, size: number}>){
    try{
      const results = await daoUploadAboutImages(files);
      if(results.data?.success){
        return results.data.results;
      }else{
        throw new Error(
          `The image presign URL wasn't completed successfully: ${results.data?.message ?? "Unknown error"}`,
        );
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async createService(service: FormAndUserData){
    try{
      const id = uuidv4();
      const serviceData: ServiceData = {
        id,
        index: Number(service.formData.get("index")?.toString()!),
        icon: service.formData.get("icon")?.toString()!,
        title: service.formData.get("title")?.toString()!,
        price: service.formData.get("price")?.toString()!,
        subtitle: service.formData.get("subtitle")?.toString()!,
        description: service.formData.get("description")?.toString()!,
        shortDescription: service.formData.get("shortDescription")?.toString()!,
        primaryList: JSON.parse(service.formData.get("primaryList")?.toString()!),
        secondaryLists: JSON.parse(service.formData.get("secondaryLists")?.toString()!),
        featured: service.formData.has("featured"),
        serviceColor: service.formData.get("serviceColor")?.toString()!
      }

      const created = (await daoCreateService(serviceData));
      
      if(created){
        return serviceData;
      }else{
        return null;
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
    async createFAQSection(faq: FormAndUserData){
    try{
      const id = uuidv4();
      const faqSection: FAQSectionData = {
        id,
        index: Number(faq.formData.get("index")?.toString()),
        title: faq.formData.get("title")?.toString() || "",
        faqs: JSON.parse(faq.formData.get("faqs")?.toString()!) || []
      }

      const created = (await daoCreateFAQSection(faqSection));
      
      if(created){
        return faqSection;
      }else{
        return null;
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async createReferral(referredBy:string, referral:string){
    try{
      const newReferral : ReferralData = {
        id: uuidv4(),
        referredBy,
        referral,
        referredOn: new Date().getTime(),
        status: "Pending"
      }
      const created = (await daoCreateReferral(newReferral)).status === HttpStatusCode.Ok;
      if(created){
        return newReferral;
      }else{
        return null;
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async createClient(client: FormData) {
    try {
      const services: string[] = client.getAll("services").map(String);
      const newClient: ClientData = {
        id: uuidv4(),
        businessId,
        clientFirstName: client.get("clientFirstName")?.toString() || "",
        clientLastName: client.get("clientLastName")?.toString() || "",
        businessName: client.get("businessName")?.toString() || "",
        email: client.get("clientEmail")?.toString() || "",
        websiteUrl: "",
        businessEmail: "",
        referred: false,
        projectDescription: client.get("clientDescription")?.toString() || "",
        services,
        dateJoined: new Date().getTime(),
        userPool: userPool!,
        phone: client.get("clientPhone")?.toString() || "",
        status: "Inactive"
      };

      const missingFields: string[] = [];
      if (!newClient.businessName || newClient.businessName === "") missingFields.push("Business Name");
      if (!newClient.email) missingFields.push("Email");
      if (!newClient.clientFirstName) missingFields.push("Client's First Name");
      if (!newClient.clientLastName) missingFields.push("Client's Last Name");
      if (!newClient.projectDescription) missingFields.push("Project Description");
      if(!newClient.phone) missingFields.push("Client Phone Number")
      if (newClient.services.length === 0) missingFields.push("At least one Service");

      if (missingFields.length > 0) {
        return Promise.reject(new Error(`Missing required field(s): ${missingFields.join(", ")}`));
      }

      const created = (await daoCreateUser(newClient)).status === HttpStatusCode.Ok;
      if (created) {
        return newClient;
      } else {
        return null;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getClients() {
    try {
      const results = await daoGetClients();
      if (results?.data.results.length > 0) {
        return results.data.results as ClientData[]
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async getClientById(clientId: string) {
    try {
      const results = await daoGetClientById(clientId);
      if (results?.data.results.length > 0) {
        return results.data.results[0] as ClientData;
      } else {
        return null;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async createProject(project: FormData, pages: PageOrFeature[], features: PageOrFeature[]) {
    try {
      const projectData: ProjectData = {
        id: uuidv4(),
        clientId: project.get("clientId")?.toString()!,
        businessId,
        title: project.get("title")?.toString() || "",
        pages,
        features,
        description: project.get("projectDescription")?.toString() || "",
        dateExpected: new Date(project.get("dateExpected")?.toString()!).getTime(),
        dateCreated: new Date().getTime(),
        status: "Not Started"
      };

      const created = (await daoCreateProject(projectData)).status === HttpStatusCode.Ok;
      if (created) {
        return projectData;
      } else {
        return null;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getProjects() {
    try {
      const projects = await daoGetProjects();
      if (projects?.data.results.length > 0) {
        return projects?.data.results as ProjectData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getServices(){
    try{
      const services = await daoGetServices();
      if(services?.data.results.length > 0){
        return services?.data.results as ServiceData[]
      }else{
        return []
      }
    }catch(err){
      return Promise.reject(err)
    }
  },
    async getFAQ(){
    try{
      const faqs = await daoGetFAQ();
      if(faqs?.data.results.length > 0){
        return faqs?.data.results as FAQSectionData[]
      }else{
        return []
      }
    }catch(err){
      return Promise.reject(err)
    }
  },
  async getAbout(){
    try{
      const services = await daoGetAbout();
      if(services?.data.results.length > 0){
        return services?.data.results as AboutSectionData[]
      }else{
        return []
      }
    }catch(err){
      return Promise.reject(err)
    }
  },
    async getPortfolio(){
    try{
      const portfolio = await daoGetPortfolio();
      if(portfolio?.data.results.length > 0){
        return portfolio?.data.results as PortfolioData[]
      }else{
        return []
      }
    }catch(err){
      return Promise.reject(err)
    }
  },  
  async getWorkOrders(){
    try{
      const services = await daoGetWorkOrders();
      if(services?.data.results.length > 0){
        return services?.data.results as WorkOrderData[]
      }else{
        return []
      }
    }catch(err){
      return Promise.reject(err)
    }
  },
  async getProjectsByClientId(clientId:string){
        try {
      const results = await daoGetProjectsByClientId(clientId);
      if (results?.data.results.length > 0) {
        return results?.data.results as ProjectData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async updateProject(originalProject: ProjectData, newProject: ProjectData) {
    try {
      const updates: Record<string, any> = {};
      for (const [key, originalValue] of Object.entries(originalProject)) {
          const newValue = newProject[key as keyof ProjectData];
          if (originalValue !== newValue && newValue !== undefined) {
            updates[key] = newValue//!.toString();
          }
      }
      const results = await daoUpdateProject(updates, originalProject.id);
      if (!results?.data?.success) {
        return Promise.reject(new Error("The project was not updated successfully"));
      }
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async updatePlatformStatus(status: Status ) {
    try {
      const results = await daoUpdatePlatformStatus(status);
      if(!results.success){
        throw new Error(results.message || "Failed to update platform status");
      }
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async updateBusinessInfo(originalBusinessInfo: BusinessInfoData, newBusinessInfo: BusinessInfoData ) {

    try {
      const updates: Record<string, any> = {};
      for (const [key, newValue] of Object.entries(newBusinessInfo)) {
        if(key === "id") continue;
          const orignalValue = originalBusinessInfo[key as keyof BusinessInfoData];
          if (newValue !== orignalValue) {
            updates[key] = newValue//!.toString();
          }
      }
      const results = await daoUpdateBusinessInfo(updates, businessId);
      if (!results?.data?.success) {
        return Promise.reject(new Error("The business info was not updated successfully"));
      }
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async updateAboutSection(originalSection: AboutSectionData, newSection:AboutSectionData){
    try{
      const updates: Record<string, any> = {};
      for(const [key, originalValue] of Object.entries(originalSection)){
        const newValue = newSection[key as keyof AboutSectionData]
        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue;
        }
      }

      const results = await daoUpdateAboutSection(updates, originalSection.id);
      if(!results?.data?.success){
        return Promise.reject(new Error("The About Section was not updated successfully"));
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
    async updatePortfolio(originalSection: PortfolioData, newSection:PortfolioData){
    try{
      const updates: Record<string, any> = {};
      for(const [key, originalValue] of Object.entries(originalSection)){
        const newValue = newSection[key as keyof PortfolioData]
        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue;
        }
      }

      const results = await daoUpdatePortfolio(updates, originalSection.id);
      if(!results?.data?.success){
        return Promise.reject(new Error("The Portfolio Data was not updated successfully"));
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
},
    async updateWorkOrder(originalWorkOrder: WorkOrderData, newWorkOrder:WorkOrderData){
    try{
      const updates: Record<string, any> = {};
      for(const [key, originalValue] of Object.entries(originalWorkOrder)){
        const newValue = newWorkOrder[key as keyof WorkOrderData]
        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue;
        }
      }


      const results = await daoUpdateWorkOrder(updates, originalWorkOrder.id);
      if(!results?.data?.success){
        return Promise.reject(new Error("The Work Order was not updated successfully"));
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
  async updateService(originalService: ServiceData, newService:ServiceData){
    try{
      const updates: Record<string, any> = {}

      for(const [key, originalValue] of Object.entries(originalService)){
        const newValue = newService[key as keyof ServiceData];

        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue;
        }
      }

      const results = await daoUpdateService(updates, originalService.id)

      if(!results?.data?.success){
        return Promise.reject("The Service was not updated successfully");
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
    async updateFAQSection(originalFAQSection: FAQSectionData, newFAQSection:FAQSectionData){
    try{
      const updates: Record<string, any> = {}

      for(const [key, originalValue] of Object.entries(originalFAQSection)){
        const newValue = newFAQSection[key as keyof FAQSectionData];

        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue;
        }
      }

      const results = await daoUpdateFAQSection(updates, originalFAQSection.id)

      if(!results?.data?.success){
        return Promise.reject("The Service was not updated successfully");
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
  async updateClient(originalClient:ClientData, newClient:ClientData){
    try{
      const updates: Record<string, unknown> = {};
      for(const [key, newValue] of Object.entries(newClient)){
        const originalValue = originalClient[key as keyof ClientData];
        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue;
        }
      }
      const results = await daoUpdateClient(updates, originalClient.id)
    
      if(!results?.data?.success){
        return Promise.reject(new Error("The client was not updated successfully"));    
      }
      return true;

    }catch(err){
      return Promise.reject(err);
    }
  },
  async createHosting(formData:FormData){
    try{
      const timeInDay = 1000 * 60 * 60 * 24
      const currentTime = new Date().getTime();
      const hostingData : HostingData = {
        id: uuidv4(),
        clientId: formData.get("clientId")?.toString()!,
        startTime: currentTime,
        endTime: new Date(currentTime + (parseInt(formData.get("hosting")?.toString()!) * (timeInDay * 30))).getTime(),
        selfHosted: formData.get("selfHosted")?.toString()! === "true",
        status: "Active"
      }

      const created = (await daoCreateHosting(hostingData)).status === HttpStatusCode.Ok;
      if (created) {
        return hostingData;
      } else {
        return null;
      }    
    }catch(err){
      return Promise.reject(err);
    }
  },
  async updateHosting(originalHosting:HostingData, newHosting: HostingData){
    try{
      const updates: Record<string, any> = {};
      for(const [key, originalValue] of Object.entries(originalHosting)){
        const newValue = newHosting[key as keyof HostingData];
        if(originalValue !== newValue && newValue !== undefined){
          updates[key] = newValue.toString()
          if(key === "endTime" || key === "startTime"){
            updates[key] = parseInt(updates[key]);
          }
        }
      }

      updates.expectedEndTime = originalHosting.endTime;
      const results = await daoUpdateHosting(updates, originalHosting.id)

      if (!results?.data?.success) {
        return Promise.reject(new Error("The ticket was not updated successfully"));
      }else{
        return true
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getHosting(){
    try{
      const hosting = await daoGetHosting();
      if (hosting?.data.results.length > 0) {
        return hosting?.data.results as HostingData[];
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getHostingById(clientId: string) {
    try {
      const results = await daoGetHostingById(clientId);
      if (results?.data.results.length > 0) {
        return results?.data.results as HostingData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getWorkingTickets() {
    try {
      const tickets = await daoGetWorkingTickets();
      if (tickets?.data.results.length > 0) {
        return tickets?.data.results as TicketData[];
      }
      return [];
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getTicketById(ticketId: string) {
    try {
      const result = await daoGetTicketById(ticketId);
      return result.data.results[0] as TicketData | undefined;
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getTicketsById(clientId: string) {
    try {
      const results = await daoGetTicketsById(clientId);
      if (results?.data.results.length > 0) {
        return results?.data.results as TicketData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async createTicket(ticket: FormAndUserData) {
    try {
      const id = uuidv4()
      const ticketData: TicketData = {
        id,
        createdById: ticket.userId,
        businessId,
        description: ticket.formData.get("description")?.toString() || "",
        category: ticket.formData.get("category")?.toString() || "",
        dateCreated: new Date().getTime(),
        status: "In Progress"
      };
      
      const response = await daoCreateTicket(ticketData);
      if (response.status !== HttpStatusCode.Ok) return null;
      const createdTicket = response.data.result ?? ticketData;
      await sendTicketEmail({
        businessId,
        email: {
          fromEmail: supportEmail,
          toEmail: supportEmail,
          fromName: `${siteConfig.name} Support`,
          toName: `${siteConfig.name} Support`,
          htmlBody: createTicketCreatedEmailHtml({
            ticketId: createdTicket.id,
            category: createdTicket.category,
            description: createdTicket.description,
          }),
          subject: `A new ${siteConfig.name} support ticket was created`,
        },
      });
      return createdTicket;
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async createMessage(message: CreateMessageData, { clientName, clientEmail }: { clientName?: string; clientEmail?: string }) {
    try {
      const messageData: MessageData = {
        id: uuidv4(),
        chatId: message.chatId,
        from: message.from,
        message: message.message,
        date: new Date().getTime(),
      };
      const response = await daoCreateMessage(messageData);
      const created = response.status === HttpStatusCode.Ok;
      
      if (created) {
        const createdMessage = response.data.result ?? messageData;
        if(createdMessage.from === "support" && clientEmail){
          const htmlBody = createTicketResponseEmailHtml({clientName: clientName, ticketId: message.chatId});

          const email : SendEmailRequest = {
            businessId: businessId,
            email: {
              fromEmail: siteConfig.supportEmail,
              toEmail: clientEmail,
              fromName: `${siteConfig.name} Support`,
              toName: clientName || "Client",
              htmlBody: htmlBody,
              subject: `${siteConfig.name} Support has responded to your ticket`
            }
          }

          await sendTicketEmail(email)
        }else if(createdMessage.from === "client"){
          await sendTicketEmail({
            businessId,
            email: {
              fromEmail: supportEmail,
              toEmail: supportEmail,
              fromName: `${siteConfig.name} Support`,
              toName: `${siteConfig.name} Support`,
              htmlBody: createClientTicketResponseEmailHtml({
                ticketId: createdMessage.chatId,
                message: createdMessage.message,
              }),
              subject: `A client responded to a ${siteConfig.name} support ticket`,
            },
          });
        }
        return createdMessage;
      } else {
        return null;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  async getTicketMessages(ticketId: string) {
    try {
      const results = await daoGetTicketMessages(ticketId);
      if (results?.data.results.length > 0) {
        return results?.data.results as MessageData[];
      } else {
        return [];
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async uploadAboutSections(sections:AboutSectionData[], idsToDelete: string[]){
    try{
      const results = await daoUploadAboutSections(sections, idsToDelete);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue uploading the about sections")
      }
      return true;
    }catch(err){
      return Promise.reject(err)
    }
  },
    async uploadServices(services:ServiceData[], idsToDelete: string[]){
    try{
      const results = await daoUploadServices(services, idsToDelete);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue uploading the services")
      }
      return true;
    }catch(err){
      return Promise.reject(err)
    }
  },
  async uploadFAQSections(sections:FAQSectionData[], idsToDelete: string[]){
    try{
      const results = await daoUploadFAQSections(sections, idsToDelete);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue uploading the FAQ sections")
      }
      return true;
    }catch(err){
      return Promise.reject(err)
    }
  },
  async deleteAboutSections(ids:string[]){
    try{
      const results = await daoDeleteAboutSections(ids);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue uploading the about sections")
      }
      return true;
    }catch(err){
      return Promise.reject(err)
    }
  },
  async updateTicket(originalTicket: TicketData, newTicket: TicketData) {
    try {
      let statusChanged = false;
      const updates: Record<string, string> = {};
      for (const [key, originalValue] of Object.entries(originalTicket)) {
        if (key !== "messages") {
          const newValue = newTicket[key as keyof TicketData];
          if (originalValue !== newValue && newValue !== undefined) {
            updates[key] = newValue!.toString();

            if(key === "status"){
              statusChanged = true;
            }
          }
        }
      }
      //Get the client and pass them through the function.
      const results = await daoUpdateTicket(updates, originalTicket.id);

      if (!results?.data?.success) {
        return Promise.reject(new Error("The ticket was not updated successfully"));
      }
      // Build metadata update
      const metaDataUpdates: Record<string, any> = {
        lastUpdated: Date.now()
      };

      await daoUpdateTicketMetadata(`businessId_${businessId}_metadata`, metaDataUpdates);
      if (statusChanged) {
        metaDataUpdates.status = newTicket.status;
      }
      await daoUpdateTicketMetadata(`ticketId_${originalTicket.id}_metadata`, metaDataUpdates);
      
      return true;
    } catch (err) {
      return Promise.reject(err);
    }
  },
  async deleteAboutSection(id: string){
    try{
      const results = await daoDeleteAboutSection(id);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue deleting the About Section")
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
  async deleteContactSubmission(id: string){
    try{
      const results = await daoDeleteContactSubmission(id);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue deleting the Contact Submission")
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
    async deletePortfolio(id: string){
    try{
      const results = await daoDeletePortfolio(id);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue deleting the Portfolio Data")
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },  
  async deleteWorkOrder(id: string){
    try{
      const results = await daoDeleteWorkOrder(id);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue deleting the Work Order")
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
  async deleteService(id: string){
    try{
      const results = await daoDeleteService(id);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue deleting the Service")
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
  async deleteFAQSection(id: string){
    try{
      const results = await daoDeleteFAQSection(id);
      if(!results?.data.success){
        if(results?.data.message){
          return Promise.reject(results?.data.message);
        }
        return Promise.reject("There was an issue deleting the FAQ Section")
      }
      return true;
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getTicketsAfterDate(lastFetched:number) {
    try{
      const results = await daoGetTicketsAfterDate(lastFetched);
      if(results?.data.results.length > 0){
        return results.data.results as TicketData[];
      }else{
        return [];
      }
    }catch(err){
      return Promise.reject(err);
    }
  },
  async getMetaData(_table: string, id: string) {
    try {
      const results = await daoGetTicketMetadata(id);
      if (results.data.result) {
        return results.data.result as MetaData;
      } else {
        return null;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
};

export default adminService;

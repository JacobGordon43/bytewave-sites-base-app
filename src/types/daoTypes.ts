export type Status = "operational" | "emergency-shutdown" | "infrastructure-maintenance"
export interface EmailEntryData {
  address: string;
  label: string;
  isContactForm: boolean;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

export interface BusinessInfoData{
  id: string,
  phoneNumber: string,
  address: string,
  emails: EmailEntryData[],
  businessHours: HoursEntryData[],
  siteMaintenance: boolean,
  addressPrecursor: "none" | "based-in" | "located-at"
  websiteUrl: string
  socialMedia?: SocialMedia
}

export interface HoursEntryData {
  day: string;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

export interface PortfolioData {
  id: string;
  title: string;
  category: string;
  description: string;
  website: string;
  imageUrl: string;
  imageFile?:File
}

export interface ConsultationSubmissionData {
  id: string;
  type: 'consultation';
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
  submittedAt: number;
  turnstileToken: string | null
}

export interface ContactSubmissionData {
  id: string;
  type: 'contact';
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  submittedAt: number;
  turnstileToken: string | null;
}
export type Submission = ConsultationSubmissionData | ContactSubmissionData;

export interface WorkOrderData {
  id: string;
  description: string;
  clientName: string;
  tasks: TaskData[];
  createdAt: number;
  ticketId?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  expectedCompletion: number;
}
export interface TaskData {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface MetricData {
  id: "revenue",
  totalRevenueCents?:number
}
export interface TicketData {
  id: string;
  businessId: string;
  createdById: string;
  category: string;
  description: string;
  dateCreated: number; // now a timestamp
  status: "Resolved" | "In Progress";
  messages?: MessageData[];
}

export interface ContentBlockData { 
  id: string,
  type: 'text' | 'image',
  title?: string,
  description?:string,
  imageUrl?: string,
  imageFile?:File,
  icon?:string,
  iconColor?:string
}
export interface AboutSectionData { 
  id: string,
  index: number,
  title?: string,
  subtitle?:string,
  columns: 1 | 2 | 3,
  rows: number,
  isCard: boolean,
  cardType: 'none' | 'icon' | 'image',
  backgroundColor: string,
  blocks: ContentBlockData[]
}

export interface FAQItemData{
  id: string,
  question:string,
  answer: string
}

export interface FAQSectionData{
  id: string,
  index: number,
  title:string,
  faqs: FAQItemData[]
}
export interface ListItemData { 
  id: string,
  text: string
}

export interface ListSectionData { 
  id: string,
  title: string,
  items: ListItemData[]
}
export interface ServiceData{
  id: string,
  index: number,
  icon: string,
  title: string,
  subtitle: string, 
  description: string,
  shortDescription: string,
  price: string,
  primaryList: ListSectionData,
  secondaryLists: ListSectionData[],
  featured:boolean,
  featuredTitle?: string,
  featuredDescription?: string,
  serviceColor: string
}
export interface MetaData {
    id : string, 
    lastUpdated : number,
    status?: "In Progress" | "Resolved"
}
export interface FormAndUserData {
  formData: FormData;
  userId: string;
}
export interface CreateMessageData{
    message: string, 
    from: "client" | "support",
    chatId: string,
    clientId: string
}
export interface MessageData {
  id: string;
  chatId: string;
  message: string;
  from: "client" | "support";
  date: number; // now a timestamp
}

export interface HostingData {
  id: string, 
  clientId: string,
  startTime: number,
  endTime: number,
  status: "Active" | "Expired"
  selfHosted: boolean
}

export interface ClientData {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  businessId: string;
  businessName: string;
  email: string;
  phone: string;
  referred?: boolean;
  projectDescription: string;
  services: string[];
  dateJoined: number; // now a timestamp
  userPool: string;
  websiteUrl: string;
  businessEmail: string;
  status: "Active" | "Inactive" | "Past Due"
}

export interface VisitorData {
  last24Hours: number;
  lastMonth: number;
  lastYear: number;
}

export interface PaymentItemData {
    recurring?: { interval: "month" | "year"; intervalCount: number };
    hosting?: boolean;
    pricingMode?: "custom" | "catalog" | "override";
    stripeProductId?: string;
    stripePriceId?: string;
    stripeTaxCode?: string;
  id: string,
  item: string,
  unitPrice: number
  quantity: number,
}
export interface PaymentData {
  billingMode?: "payment" | "subscription";
  subscriptionSourceId?: string;
  stripeAmountTotal?: number;
  stripeTaxAmount?: number;
  id: string;
  businessId: string;
  clientId: string;
  amount: number;
  date: number; // now a timestamp
  productId?: string;
  items: PaymentItemData[];
  status: "Completed" | "Pending" | "Overdue" | "Canceled";
  platform: "Zelle" | "PayPal" | "Stripe"
}

export interface PageOrFeature {
  id: string,
  label: string;
  type: "page" | "feature";
  status: "Not Started" | "In Progress" | "Completed";
}

export interface ProjectData {
  id: string;
  clientId: string;
  businessId: string;
  title: string
  pages: PageOrFeature[];
  features: PageOrFeature[];
  description: string;
  dateCreated: number;   
  dateExpected: number;  
  dateCompleted?: number;
  status:
    | "Not Started"
    | "Design/Early Development"
    | "In Progress"
    | "Completed";
}

export interface ReferralData{
  id: string,
  referredBy: string,
  referral: string,
  referredOn: number,
  status: "Rewarded" | "Pending"
  
}

export interface RentalData {
  id: string;
  businessId?: string;
  [key: string]: unknown;
}

export interface ProductData {
  id: string;
  businessId?: string;
  [key: string]: unknown;
}

export interface EmailData {
  id: string;
  businessId?: string;
  email: string;
  subscribed: boolean;
  createdAt?: number;
  lastUpdated?: number;
  [key: string]: unknown;
}

export interface SendEmailRequest {
    businessId: string,
    email: {
        toEmail: string,
        fromName: string,
        toName?: string,
        fromEmail: string,
        htmlBody: string,
        subject: string
    }
}

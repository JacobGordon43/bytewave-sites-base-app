import { adminCreateUser } from './lambda/admin-create-user/resource';
import { updatePlatformStatus } from './lambda/update-platform-status/resource';
import { createProjectData } from './lambda/create-project-data/resource';
import { getProjectData } from './lambda/get-project-data/resource';
import { updateProjectData } from './lambda/update-project-data/resource';
import { deleteProjectData } from './lambda/delete-project-data/resource';
import { getPortfolioData } from './lambda/get-portfolio-data/resource';
import { deletePortfolioData } from './lambda/delete-portfolio-data/resource';
import { getPaymentsByClientId } from './lambda/get-payments-by-client-id/resource';
import { getReferralsByClientId } from './lambda/get-referrals-by-client-id/resource';
import { getTicketsAfterDate } from './lambda/get-tickets-after-date/resource';
import { getMetadata } from './lambda/get-metadata/resource';
import { createStripeSession } from './lambda/create-stripe-session/resource';
import { getStripeSession } from './lambda/get-stripe-session/resource';
import { stripeWebhook } from './lambda/stripe-webhook/resource';
import { stripeCatalog } from './lambda/stripe-catalog/resource';
import { manageSubscriptions } from './lambda/manage-subscriptions/resource';

export const businessFunctions = {
  manageSubscriptions,
  stripeCatalog,
  adminCreateUser,
  updatePlatformStatus,
  createProjectData,
  getProjectData,
  updateProjectData,
  deleteProjectData,
  getPortfolioData,
  deletePortfolioData,
  getPaymentsByClientId,
  getReferralsByClientId,
  getTicketsAfterDate,
  getMetadata,
  createStripeSession,
  getStripeSession,
  stripeWebhook,
};

export const siteConfig = {
  name: import.meta.env.VITE_APP_NAME || "Website",
  origin: import.meta.env.VITE_APP_SITE_ORIGIN || window.location.origin,
  supportEmail: import.meta.env.VITE_APP_SUPPORT_EMAIL || "",
  billingEmail: import.meta.env.VITE_APP_BILLING_EMAIL || "",
};

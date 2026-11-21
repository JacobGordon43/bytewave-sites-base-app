/** Shared, side-effect-free create contracts used before browser requests and Lambda writes.
 * Server-owned identity, tenant, totals and timestamps are checked/derived by handlers.
 * Do not treat false or 0 as missing. Optional fields may be empty.
 */
type RecordValue = Record<string, unknown>;
type Rule = (value: unknown, path: string, errors: string[]) => void;
export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly errors: string[];
  constructor(errors: string[]) {
    super(`Please correct the following fields: ${errors.join('; ')}`);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
const text: Rule = (v, p, e) => { if (typeof v !== 'string' || !v.trim()) e.push(`${p} is required`); };
const boolean: Rule = (v, p, e) => { if (typeof v !== 'boolean') e.push(`${p} must be true or false`); };
const number = (min = 0, integer = false): Rule => (v, p, e) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || (integer && !Number.isSafeInteger(v))) e.push(`${p} must be a valid ${integer ? 'whole ' : ''}number${min ? ` of at least ${min}` : ''}`);
};
const email: Rule = (v, p, e) => { if (typeof v !== 'string' || v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) e.push(`${p} must be a valid email address`); };
const choice = (...values: (string | number)[]): Rule => (v, p, e) => { if (!values.includes(v as string)) e.push(`${p} must be one of: ${values.join(', ')}`); };
const optional = (rule: Rule): Rule => (v, p, e) => { if (v !== undefined && v !== null && v !== '') rule(v, p, e); };
const array = (rule: Rule, min = 0): Rule => (v, p, e) => {
  if (!Array.isArray(v) || v.length < min) { e.push(`${p} must contain ${min ? `at least ${min} item(s)` : 'an array'}`); return; }
  v.forEach((item, i) => rule(item, `${p}[${i + 1}]`, e));
};
const object = (shape: Record<string, Rule>): Rule => (v, p, e) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) { e.push(`${p} must be an object`); return; }
  for (const [key, rule] of Object.entries(shape)) rule((v as RecordValue)[key], `${p}.${key}`, e);
};
const record = (v: unknown): RecordValue => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordValue : {};
const richText: Rule = (v, p, e) => text(typeof v === 'string' ? v.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').trim() : v, p, e);
const id = text;
const timestamp = number(0, true);
const list = object({ id, title: text, items: array(object({ id, text }), 1) });
const block: Rule = (v, p, e) => {
  object({ id, type: choice('text', 'image') })(v, p, e);
  const b = record(v);
  if (b.type === 'image') text(b.imageUrl, `${p}.imageUrl`, e);
  else if (b.type === 'text') richText(b.description, `${p}.description`, e);
};
const page = object({ id, label: text, type: choice('page', 'feature'), status: choice('Not Started', 'In Progress', 'Completed') });
const billItem: Rule = (v, p, e) => {
  object({ id, quantity: number(1, true), unitPrice: number(), pricingMode: optional(choice('custom', 'catalog', 'override')) })(v, p, e);
  const b = record(v);
  if (!b.pricingMode || b.pricingMode === 'custom') text(b.item, `${p}.item`, e);
  else text(b.stripePriceId, `${p}.stripePriceId`, e);
};
export const createSchemas: Record<string, Rule> = {
  // Legacy extensible resources have only an ID contract; no additional fields are
  // declared by their callers/types. Avoid inventing required business fields.
  business: object({ id }), beliefs: object({ id }), sermons: object({ id }),
  events: object({ id }), rentals: object({ id }), products: object({ id }),
  'business-info': object({ id, phoneNumber: text, address: text, websiteUrl: text,
    addressPrecursor: choice('none', 'based-in', 'located-at'), siteMaintenance: boolean,
    emails: array(object({ address: email, label: text, isContactForm: boolean }), 1),
    businessHours: array((v, p, e) => {
      object({ day: text, closed: boolean })(v, p, e);
      const h = record(v);
      if (h.closed === false) object({ openTime: text, closeTime: text })(v, p, e);
    }),
  }),
  clients: object({ id, clientFirstName: text, clientLastName: text, businessName: text,
    email, phone: text, projectDescription: text, services: array(text, 1), dateJoined: timestamp,
    userPool: text, status: choice('Active', 'Inactive', 'Past Due'), businessEmail: optional(email),
  }),
  projects: object({ id, clientId: id, title: text, description: text, dateCreated: timestamp,
    dateExpected: timestamp, pages: array(page), features: array(page),
    status: choice('Not Started', 'Design/Early Development', 'In Progress', 'Completed'),
  }),
  'custom-pages': object({ id, index: number(0, true), columns: choice(1, 2, 3), rows: number(1, true),
    isCard: boolean, cardType: choice('none', 'icon', 'image'), backgroundColor: text, blocks: array(block, 1) }),
  faq: object({ id, index: number(0, true), title: text, faqs: array(object({ id, question: text, answer: richText }), 1) }),
  services: (v, p, e) => {
    object({ id, index: number(0, true), icon: text, title: text, subtitle: text, description: richText,
      shortDescription: text, price: text, primaryList: list, secondaryLists: array(list), featured: boolean, serviceColor: text })(v, p, e);
    if (record(v).featured === true) object({ featuredTitle: text, featuredDescription: text })(v, p, e);
  },
  portfolio: object({ id, title: text, category: text, description: text, website: text, imageUrl: text }),
  referrals: object({ id, referredBy: id, referral: id, referredOn: timestamp, status: choice('Rewarded', 'Pending') }),
  'work-orders': object({ id, description: text, clientName: text, createdAt: timestamp, expectedCompletion: timestamp,
    urgency: choice('low', 'medium', 'high', 'urgent'),
    tasks: array(object({ id, title: text, status: choice('not-started', 'in-progress', 'completed') }), 1) }),
  hosting: (v, p, e) => {
    object({ id, clientId: id, selfHosted: boolean, startTime: timestamp, endTime: timestamp, status: choice('Active', 'Expired') })(v, p, e);
    const h = record(v);
    if (h.selfHosted === false && typeof h.startTime === 'number' && typeof h.endTime === 'number' && h.endTime <= h.startTime) e.push(`${p}.endTime must be after startTime`);
  },
  emails: object({ email, subscribed: optional(boolean) }),
  tickets: object({ id, category: text, description: text }),
  messages: object({ id, chatId: id, message: text }),
  payments: object({ id, clientId: id, date: timestamp, platform: choice('Stripe', 'Zelle', 'PayPal'),
    billingMode: optional(choice('payment', 'subscription')), items: array(billItem, 1) }),
};

export function validateCreateItem(resource: string, value: unknown): void {
  const errors: string[] = [];
  const schema = createSchemas[resource];
  if (!schema) throw new Error(`Missing create validation contract: ${resource}`);
  schema(value, resource, errors);
  if (errors.length) throw new ValidationError(errors);
}

export function validateCreateRequest(path: string, value: unknown, method = 'POST'): void {
  path = path.split('?')[0].replace(/\/$/, '');
  method = method.toUpperCase();
  const batch = /^\/app\/admin\/([^/]+)\/batch$/.exec(path);
  if (method === 'PUT' && batch && createSchemas[batch[1]]) {
    const errors: string[] = [];
    object({ itemsToSave: array(createSchemas[batch[1]]), idsToDelete: array(id) })(value, 'request', errors);
    if (errors.length) throw new ValidationError(errors);
    return;
  }
  if (method !== 'POST') return;
  const resource = /^\/app\/admin\/([^/]+)$/.exec(path)?.[1]
    ?? ({ '/internal/hosting': 'hosting', '/app/messages': 'messages', '/app/support/tickets': 'tickets' } as Record<string,string>)[path];
  if (resource && createSchemas[resource]) { validateCreateItem(resource, record(value).item); return; }
  const errors: string[] = [];
  const body = record(value);
  if (path === '/public/contact-form-logs') {
    object({ businessId: id, item: object({ id, type: choice('contact', 'consultation'), name: text, email, phone: optional(text), company: optional(text), projectType: optional(text), budget: optional(text), timeline: optional(text) }) })(value, 'request', errors);
    const item = record(body.item);
    text(body.turnstileToken ?? item.turnstileToken, 'CAPTCHA verification', errors);
    if (item.type === 'contact') object({ subject: text, message: text })(item, 'contact', errors);
    if (item.type === 'consultation') object({ description: text })(item, 'consultation', errors);
  } else if (path === '/internal/users') {
    object({ email, groupName: optional(choice('Client')) })(value, 'account', errors);
  } else if (path === '/internal/platform/status') {
    object({ platformStatus: choice('operational', 'emergency-shutdown', 'infrastructure-maintenance') })(value, 'request', errors);
  } else if (path === '/app/payments/stripe/session') {
    object({ paymentId: id })(value, 'checkout', errors);
  } else if (path === '/app/admin/catalog') {
    object({ name: text, amount: number(), published: boolean, interval: choice('one_time', 'month', 'six_months', 'year'), requestId: id })(value, 'service', errors);
  } else if (path === '/app/admin/emails/send') {
    object({ email: object({ businessId: id, email: object({ toEmail: email, fromEmail: email, fromName: text, subject: text, htmlBody: richText }) }) })(value, 'request', errors);
  } else if (path === '/app/files/presign') {
    object({ category: text, files: array(object({ id, type: choice('image/jpeg', 'image/png', 'image/webp'), size: number(1, true) }), 1) })(value, 'upload', errors);
  } else if (/^\/app\/subscriptions\/.*\/(cancel|portal)$/.test(path)) {
    const subscriptionId = path.split('/')[3];
    if (!subscriptionId || ['undefined', 'null'].includes(subscriptionId)) errors.push('Subscription ID is required');
  }
  if (errors.length) throw new ValidationError(errors);
}

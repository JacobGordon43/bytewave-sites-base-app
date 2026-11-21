/** Read-time display defaults only: never writes repaired values back to storage. */
export function getContactSubmissionDisplay(value: unknown) {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const text = (field: string): string => typeof record[field] === 'string' ? record[field] as string : '';
  const name = text('name').trim();
  const email = text('email').trim();
  const type = record.type === 'contact' || record.type === 'consultation' ? record.type : 'unknown';
  const content = type === 'consultation' ? text('description')
    : type === 'contact' ? text('message') : text('message') || text('description');
  const timestamp = record.submittedAt;
  const date = typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp >= 0
    ? new Date(timestamp) : null;
  const validDate = date && Number.isFinite(date.getTime());
  return {
    id: text('id').trim(),
    type,
    typeLabel: type === 'consultation' ? 'Consultation' : type === 'contact' ? 'Contact' : 'Unknown type',
    name: name || 'Missing name',
    initial: name ? Array.from(name)[0] : '?',
    email: email || 'Missing email',
    replyHref: /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email) ? `mailto:${encodeURIComponent(email)}` : undefined,
    phone: text('phone'),
    company: text('company'),
    subject: text('subject'),
    projectType: text('projectType') || 'Not provided',
    content: content.trim() ? content : 'Missing message',
    canExpand: content.length > 120,
    dateLabel: validDate ? date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }) : 'Unknown date',
  };
}

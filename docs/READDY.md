# Readdy design handoff

Use this repository as the behavior and data-flow reference for a new website. Replace presentation while keeping page/component boundaries, service calls, types, Redux contracts and validation intact.

Keep form values and onChange/onSubmit handlers; preserve disabled/pending submission guards, keyboard handling, auth checks, route parameters, error dismissal/retry and empty states. Keep public errors above the affected section, with no error display in the footer or public loading text.

The remaining markup is a minimal working scaffold, not a finished UI. Decorative backgrounds return null. `src/utils/presentation.ts` filters original dynamic classes/styles to functional visibility/layout properties and gives icon controls text symbols. You can replace these presentation helpers when implementing the new design, preserving their conditional visibility behavior and accessible button labels.

Use `src/config/site.ts` for application identity. Content-dependent sections continue to use backend records. Review static placeholder copy for the client's industry. Do not introduce a new authentication, ticketing or Stripe implementation just to redesign a page.

Backend changes should be deliberate and separate from design work. Preserve the current EventBridge integration and ticket/billing notification flow.

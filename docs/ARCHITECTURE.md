# Architecture

`src/pages` and `src/components` retain the original page/component boundaries and event handlers. `src/hooks` holds shared read behavior; hooks read each Redux slice's status/error and expose retry alongside data. No FAQ editor/action hooks were introduced.

`src/redux` retains the original slices, entity adapters and persisted session store. `src/services/adminService.ts` orchestrates operations and notifications; `src/services/backend/adminDAO.ts` and the Axios transport perform API requests. `src/types`, `shared` and Lambda shared utilities retain the existing data and validation contracts.

`amplify/backend.ts` retains the original functions, HTTP API routes, IAM grants, tables and event wiring. `amplify/application-config.ts` validates values belonging to each new deployment. `amplify/stripe-events-config.ts` selects an explicitly configured Stripe partner bus; it no longer defaults to the original account's bus.

Ticket notifications still follow the original service calls after ticket/message writes. Their existing dependence on browser follow-up requests is preserved, not redesigned here. Ticket businessMetadata synchronization remains as well.

Stripe uses the original EventBridge processing, despite the existing `stripe-webhook` folder name. Payment, hosting, subscription and notification-ledger models remain separate. Billing notifications retain stream processing and failure handling.

The `Bytewave-Admin` Cognito group and `bytewaveSubscription` Stripe metadata key are internal compatibility identifiers. Renaming them requires a coordinated migration across callers and backend authorization/event processing.

`src/config/site.ts` supplies public identity; `src/config/runtime.ts` reads generated outputs or explicit auth/API fallbacks. Imported image/status buckets retain their original responsibilities. Monitoring stays disabled.

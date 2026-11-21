# bytewave-sites-base-app

A reusable extraction of bytewave-sites-gen2 for future applications. The existing backend, authentication, Redux, services/DAOs, ticketing and billing workflows are retained. Pages and components have minimal presentation for a new design.

## Local development

```sh
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the frontend values as you set up the new application. Application identity overrides and one-time backend settings are listed in [deployment](docs/DEPLOYMENT.md). Without backend configuration, pages can render but data requests fail with configuration errors; live workflows require a separately deployed backend. No original environment files, generated Amplify outputs or customer records are included.

Vite loads `amplify_outputs.json` when present, with environment fallbacks for authentication and the API endpoint. Restart Vite after generating outputs. Never reuse the original site's outputs for a new client.

## Preserved implementation

- Original Lambda layout, adminService/adminDAO methods, validation, authorization and DynamoDB models.
- Cognito authentication, role routing, Redux session persistence and private-state cleanup.
- Public page read hooks, retry/dismiss feedback, empty states and admin editing behavior.
- Ticket creation, messages, resolution, submission guards, notifications and businessMetadata synchronization.
- Stripe EventBridge events, payment/subscription/hosting workflows and billing notification processing. There is no replacement HTTP webhook or generic billing table.
- Original imported S3 bucket approach and disabled monitoring infrastructure.

There are no new feature flags or editor hooks. Ticketing and billing remain included. The internal `Bytewave-Admin` role and `bytewaveSubscription` Stripe metadata key remain unchanged to preserve their contracts.

## Changes from the source

Decorative styling, backgrounds and branded assets were removed. Semantic markup, inputs, event handlers and visibility behavior remain. Site identity and deployment-specific buckets, addresses, origins and Stripe bus settings are configurable. New deployments use generated physical DynamoDB table names instead of the original production table names.

See [architecture](docs/ARCHITECTURE.md), [deployment](docs/DEPLOYMENT.md) and [Readdy handoff](docs/READDY.md).

## Validation

```sh
npm run build
npm run check:backend
npm run lint
npx ampx pipeline-deploy --help
```

No test suites are included. These checks do not deploy resources or validate live AWS/Stripe workflows. Verify the configured application in its own test environment before launch. Dependency versions and security overrides are inherited from the source.

## Parity audit

The starter was compared against the original application's frontend and all 260 backend files. All 39 Redux files, 13 hooks, five type files, shared create contracts, DAO methods, route definitions and DynamoDB schema definitions retain their source implementations. Backend changes are limited to deployment-specific configuration and email/error display values; ticket notification and Stripe EventBridge processing remain in place.

The comparison caught and corrected functional styles lost during presentation removal: accordion/menu visibility, modal positioning, disabled pointer handling and invoice printing. Analytics, robots exclusions, the public status file and four missing bundled dependency lock entries were also restored. Tailwind remains available for functional utilities; client-specific decorative styling is still filtered.

Application-specific origins, bucket names, email addresses and Stripe bus selection remain configurable. Generated table names prevent collisions with the original deployment. The original domain's sitemap is intentionally excluded and must be configured for each client. Source files in the original application were not modified.

Validation covers production compilation, backend type checking, an npm clean-install dry run, functional CSS generation and dependency parity. Live AWS/Stripe workflows and a browser interaction walkthrough have not been verified by this comparison. Existing lint warnings remain; this is a parity audit, not a new security audit.

# TorchLife Backend — Phase 1 Audit Report (Ground Truth)

Date: 2026-05-17  
Repo root: `/Users/admin/Documents/ceeprel/torchlife_backend`

This report describes what is verifiably present in the repository today, highlights wiring/runtime correctness issues, and maps current capabilities against the Engineering Handbook requirements as `EXISTS`, `PARTIAL`, or `MISSING`.

---

## A) Stack + Runtime

### Detected stack
- **Language**: TypeScript (Node.js)  
  - Evidence: [package.json](file:///Users/admin/Documents/ceeprel/torchlife_backend/package.json), [tsconfig.json](file:///Users/admin/Documents/ceeprel/torchlife_backend/tsconfig.json)
- **Framework**: NestJS  
  - Evidence: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts), [nest-cli.json](file:///Users/admin/Documents/ceeprel/torchlife_backend/nest-cli.json)
- **ORM / DB**: Prisma + PostgreSQL  
  - Evidence: [prisma/schema.prisma](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma)
- **Queue**: Bull + Redis  
  - Evidence: [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts), [src/services/payments/queue-process/payment.processor.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/queue-process/payment.processor.ts)
- **API docs**: Swagger via `@nestjs/swagger`  
  - Evidence: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts)
- **Storage**: Cloudinary uploads  
  - Evidence: [src/services/upload/upload.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.service.ts)
- **Email**: Nodemailer SMTP  
  - Evidence: [src/services/email-transport/email-transport.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/email-transport/email-transport.service.ts)
- **Payments**: Partial Paystack provider code  
  - Evidence: [src/services/payments/inbound-providers/paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts)

### Versions (from real files)
- **NestJS**: `@nestjs/common` `^11.1.1` (Nest v11 line)  
  - Evidence: [package.json](file:///Users/admin/Documents/ceeprel/torchlife_backend/package.json#L28-L61)
- **Prisma**: `prisma` `^6.8.2`, `@prisma/client` `^6.8.2`  
  - Evidence: [package.json](file:///Users/admin/Documents/ceeprel/torchlife_backend/package.json#L38-L92)
- **Node.js**:
  - Docker runtime indicates **Node 20**: `FROM node:20-alpine`  
    - Evidence: [Dockerfile](file:///Users/admin/Documents/ceeprel/torchlife_backend/Dockerfile#L1-L22)
  - CI workflow uses **Node 18**  
    - Evidence: [.github/workflows/deploy.yml](file:///Users/admin/Documents/ceeprel/torchlife_backend/.github/workflows/deploy.yml#L16-L20)
  - **UNKNOWN** single enforced Node version (no `engines` in package.json, no `.nvmrc`, no `.tool-versions`).

### DB and connection approach
- Prisma datasource uses `DATABASE_URL` and provider `postgresql`  
  - Evidence: [prisma/schema.prisma](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L14-L17)
- `PrismaService extends PrismaClient` and passes datasource URL from `process.env.DATABASE_URL`  
  - Evidence: [src/prisma/prisma.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/prisma/prisma.service.ts#L26-L60)
- Prisma is registered as a global module  
  - Evidence: [src/prisma/prisma.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/prisma/prisma.module.ts#L5-L9)

### Deployment target and env usage
- Render deploy configuration exists and indicates Docker-based deployment  
  - Evidence: [.render.yaml](file:///Users/admin/Documents/ceeprel/torchlife_backend/.render.yaml)
- Docker Compose for local/prod-like stack (app + postgres + redis)  
  - Evidence: [docker-compose.yml](file:///Users/admin/Documents/ceeprel/torchlife_backend/docker-compose.yml)
- `env.example` exists; several env vars are used in code but missing from `env.example`  
  - Evidence: [env.example](file:///Users/admin/Documents/ceeprel/torchlife_backend/env.example), plus code references below.

#### Env var comparison (env.example vs code usage)
Present in `env.example` and used in code:
- `NODE_ENV`, `PORT`: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts#L42-L45)
- `DATABASE_URL`: [src/prisma/prisma.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/prisma/prisma.service.ts#L33-L36)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`: [src/services/auth/token/token.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/token/token.service.ts)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_SENDER`, `EMAIL_SECURE`: [src/services/email-transport/email-transport.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/email-transport/email-transport.service.ts#L14-L23)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: [src/services/upload/providers/cloudinary.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/providers/cloudinary.provider.ts#L7-L19)
- `PAYSTACK_URL`, `PAYSTACK_SECRET_KEY`: [src/services/payments/inbound-providers/paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts#L8-L33)

Used in code but missing from `env.example` (must be added or removed):
- `REDIS_URL`: [app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts#L22-L27)
- `resetPasswordURL`: [src/services/auth/auth.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.service.ts#L227-L245)
- `APP_BASE_URL`: [src/domain/email-templates/utils/constants.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/domain/email-templates/utils/constants.ts#L1)
- `PAYSTACK_USD_URL`, `PAYSTACK_SUBACCOUNT_CODE`, `PAYSTACK_CHARGE`: [src/services/payments/inbound-providers/paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts#L16-L53)

Also present in `env.example` but not found used (from the files audited):
- `CORS_PROD` (**UNKNOWN** if used elsewhere; not found in the scanned matches).

---

## B) Module Wiring Correctness

### All Nest modules detected (from code)
Found 9 module files:
- [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts)
- [src/prisma/prisma.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/prisma/prisma.module.ts)
- [src/services/auth/auth.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.module.ts)
- [src/services/user/user.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/user/user.module.ts)
- [src/services/payments/payments.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.module.ts)
- [src/services/upload/upload.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.module.ts)
- [src/services/campaign/campaign.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.module.ts)
- [src/services/wallet/wallet.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/wallet/wallet.module.ts)
- [src/services/email-transport/email-transport.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/email-transport/email-transport.module.ts)

### AppModule imports
`AppModule` imports:
- `PrismaModule`, `AuthModule`, `UserModule`, `PaymentsModule`, `UploadModule`, `CampaignModule`, `WalletModule`, `ConfigModule.forRoot`, `BullModule.forRoot`  
  - Evidence: [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts#L16-L33)

### Controller reachability (mounted vs orphan)

Reachable controllers (registered in a module that AppModule imports):
- `AppController` mounted in `AppModule.controllers`  
  - Evidence: [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts#L33-L35)
- `AuthController` mounted in `AuthModule.controllers`  
  - Evidence: [src/services/auth/auth.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.module.ts#L12-L17)
- `CampaignController` mounted in `CampaignModule.controllers`  
  - Evidence: [src/services/campaign/campaign.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.module.ts#L7-L10)
- `UserController` mounted in `UserModule.controllers`  
  - Evidence: [src/services/user/user.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/user/user.module.ts#L6-L10)
- `WalletController` mounted in `WalletModule.controllers`  
  - Evidence: [src/services/wallet/wallet.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/wallet/wallet.module.ts#L5-L9)

Orphan controllers (exist in code but not registered in any module):
- `PaymentsController` exists but is not mounted because `PaymentsModule.controllers` is commented out  
  - Evidence: [src/services/payments/payments.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.controller.ts), [src/services/payments/payments.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.module.ts#L10-L22)
- `UploadController` exists but `UploadModule.controllers` is empty  
  - Evidence: [src/services/upload/upload.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.controller.ts), [src/services/upload/upload.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.module.ts#L6-L9)

Orphan/duplicate service code (likely dead or conflicting):
- A second `AuthService` exists under `src/auth/auth.service.ts` separate from the active auth module under `src/services/auth/*`  
  - Evidence: [src/auth/auth.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/auth/auth.service.ts) vs [src/services/auth/auth.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.module.ts)

---

## C) Routing + Auth Enforcement

### Bootstrap / global configuration
- Global validation pipe is set twice (duplicate calls)  
  - Evidence: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts#L7-L35)
- Swagger docs mounted at `GET /api-docs`  
  - Evidence: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts#L10-L41)
- CORS enabled with default `enableCors()` (no explicit origin/credentials config)  
  - Evidence: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts#L42-L45)

### Cookie parsing (required if tokens are in cookies)
- Auth logic sets `accessToken` and `refreshToken` cookies on signup/signin/refresh  
  - Evidence: [src/services/auth/auth.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.service.ts#L52-L65), [src/services/auth/auth.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.service.ts#L128-L141)
- Middleware reads `req.cookies?.accessToken`  
  - Evidence: [src/middleware/auth.middleware.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/middleware/auth.middleware.ts#L8-L16)
- **No cookie parser registration found** in `main.ts` (no `app.use(cookieParser())`)  
  - Evidence checked: [src/main.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/main.ts)

### Auth enforcement mechanism in current code
- Middleware-based auth exists: `AuthMiddleware` verifies JWT with `jsonwebtoken` directly and sets `req.user = { id }`  
  - Evidence: [src/middleware/auth.middleware.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/middleware/auth.middleware.ts)
- It is applied only to `forRoutes('campaigns')`  
  - Evidence: [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts#L36-L40)
- Campaign controller base path is `@Controller('campaign')` (singular)  
  - Evidence: [src/services/campaign/campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L10-L13)
- Result: **auth middleware likely does not run for campaign routes** due to route mismatch.

### Endpoint list (from controllers)
The following endpoints are defined by controller decorators (`@Controller`, `@Get`, `@Post`, etc.). This list is exhaustive based on the 7 controller files detected.

Base: `/`  
Controller: [src/app.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.controller.ts)
- `GET /` → `getHello()`
- `GET /health` → `getHealth()`

Base: `/auth`  
Controller: [src/services/auth/auth.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.controller.ts)
- `POST /auth/signup` → `signUp()`
- `POST /auth/signin` → `signIn()`
- `POST /auth/forget-password` → `forgetPassword()`
- `POST /auth/reset-password` → `updatePassword()`
- `POST /auth/request-password-change` → `requestPasswordChange()`
- `POST /auth/resend-email-otp` → `resendEmailOtp()`
- `POST /auth/verify-email-otp` → `verifyEmailOtp()`
- `POST /auth/refresh` → `refreshToken()`
- `POST /auth/logout` → `logout()`

Base: `/campaign`  
Controller: [src/services/campaign/campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts)
- `POST /campaign/create-user` → `create()`
- `GET /campaign/user` → `findAllByUser()`
- `GET /campaign/:id` → `findOneById()`
- `GET /campaign/status/:status` → `findAllByStatus()`
- `GET /campaign` → `findAll()`
- `PATCH /campaign/:id` → `update()`
- `DELETE /campaign/:id` → `remove()`
- `POST /campaign/:id/verify` → `verifyCampaign()`

Base: `/payments` (ORPHAN controller; not mounted)
Controller: [src/services/payments/payments.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.controller.ts)
- `POST /payments/deposit` → `deposit()`
- `POST /payments/donation` → `donate()`
- `POST /payments/payout` → `payout()`

Base: `/upload` (ORPHAN controller; not mounted)
Controller: [src/services/upload/upload.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.controller.ts)
- `POST /upload` → `create()`
- `GET /upload` → `findAll()`
- `GET /upload/:id` → `findOne()`
- `PATCH /upload/:id` → `update()`
- `DELETE /upload/:id` → `remove()`
- `POST /upload/:campaignId` → `upload()` (multipart via `FileInterceptor('file')`)

Base: `/user`
Controller: [src/services/user/user.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/user/user.controller.ts)
- No endpoints defined (controller is empty).

Base: `/wallet`
Controller: [src/services/wallet/wallet.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/wallet/wallet.controller.ts)
- `POST /wallet` → `create()` (empty / commented)
- `GET /wallet` → `findAll()` (empty / commented)
- `GET /wallet/:id` → `findOne()` (empty / commented)
- `PATCH /wallet/:id` → `update()` (empty / commented)
- `DELETE /wallet/:id` → `remove()` (**broken**: references undefined `id`)

### Routing mismatches / correctness findings
- Campaign auth middleware uses `campaigns` but controller uses `campaign` (singular).  
  - Evidence: [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts#L36-L40), [src/services/campaign/campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L10-L13)
- Campaign controller reads `@Req() req: TokenPayload` and uses `req.id`, but middleware sets `req.user = { id }`.  
  - Evidence: [src/services/campaign/campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L15-L22), [src/middleware/auth.middleware.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/middleware/auth.middleware.ts#L19-L22)
- `@ApiBearerAuth('access-token')` exists on CampaignController but there is no corresponding guard shown; it is Swagger-only documentation.  
  - Evidence: [src/services/campaign/campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L10-L13)

---

## D) Prisma Schema Alignment

Source of truth for persisted data is Prisma schema:
- [prisma/schema.prisma](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma)

### Entities present in Prisma
- `User`, `OtpToken`, `Campaign`, `Donation`, `Payment`, `Wallet`, `WalletTransaction`, `WithdrawalRequest`, `Webhook`, `Rating`, `FileUpload`

### State enums (Prisma)
- `CAMPAIGN_STATUS`: `PENDING`, `APPROVED`, `REJECTED`
- `DONATION_STATUS`: `PENDING`, `FAILED`, `REJECTED`, `SUCCESS`
- `PAYMENT_STATUS`: `PENDING`, `FAILED`, `REJECTED`, `SUCCESS`
- plus `PAYMENT_TYPE`, `WITHDRAWAL_STATUS`, `ACCOUNT_STATUS`, `CAMPAIGN_PRIORITY`, `CURRENCY`, `USER_ROLES`, `USER_ACTIVITIES`

### Mismatches: Prisma vs DTOs vs service logic (confirmed)

Campaign creation mismatch (blocking)
- Prisma: `Campaign.records` is `String[]`  
  - Evidence: [schema.prisma Campaign](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L127-L169)
- DTO: `CreateCampaignDto` defines `record: string` (singular)  
  - Evidence: [create-campaign.dto.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/dto/create-campaign.dto.ts#L30-L33)
- Service: `CampaignService.create` returns a plain object and **does not persist** via Prisma  
  - Evidence: [campaign.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.service.ts#L16-L33)

Verification relationship assumptions
- Prisma: `Campaign.verified_by_id` is required (`String @db.Uuid()`), relation to `User`  
  - Evidence: [schema.prisma Campaign](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L144-L147)
- Service: `verifyCampaign` connects `verified_by` but does not update status; also throws plain `Error` strings  
  - Evidence: [campaign.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.service.ts#L172-L198)

Webhook selection mismatch
- Constants: `DbDataConstant.webhookData` selects `url` field  
  - Evidence: [db.constant.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/domain/constants/db.constant.ts#L121-L127)
- Prisma: `Webhook` model has `event`, timestamps, `payment_id`; no `url` field  
  - Evidence: [schema.prisma Webhook](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L284-L295)

Wallet controller correctness
- Controller has several commented endpoints and a broken `remove()` implementation  
  - Evidence: [wallet.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/wallet/wallet.controller.ts#L10-L33)

JWT expiration parsing mismatch (config vs code)
- `env.example` uses `JWT_EXPIRATION=1h` and `JWT_REFRESH_EXPIRATION=7d`  
  - Evidence: [env.example](file:///Users/admin/Documents/ceeprel/torchlife_backend/env.example#L20-L26)
- `TokenService` assumes numeric milliseconds and does `parseInt(expiresIn)` and appends `ms`  
  - Evidence: [token.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/token/token.service.ts#L13-L23)

### Domain objects in `src/domain/entities/*` (non-ORM)
- Domain classes exist (e.g. `Campaign` entity class), but they are not the ORM source of truth and appear unused by controllers/services in the audited flows.  
  - Evidence example: [src/domain/entities/campaign.entites.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/domain/entities/campaign.entites.ts)

---

## E) Payments State (Paystack-first vs current repo)

### What exists
- Paystack inbound provider supports:
  - initialize transaction: `initializePayment()`
  - verify transaction: `verifyPayment({ reference, currency })`
  - Evidence: [paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts)
- Bull processor exists for queue `payment`:
  - `verify-payment`, `process-transfer`, `process-payout`
  - Evidence: [payment.processor.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/queue-process/payment.processor.ts)

### What is partial/broken (confirmed)
- `PaymentsController` exists but is not mounted (controllers are commented out in module), so no HTTP payment endpoints are reachable.  
  - Evidence: [payments.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.module.ts#L10-L22)
- Queue job name mismatch:
  - Service enqueues `'process-donation'`, processor listens to `'process-transfer'`  
    - Evidence: [payments.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.service.ts#L87-L93), [payment.processor.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/queue-process/payment.processor.ts#L45-L74)
- Provider signature mismatch:
  - Processor calls `verifyPayment(job.data.paymentId)` but Paystack provider expects `{ reference, currency }`  
    - Evidence: [payment.processor.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/queue-process/payment.processor.ts#L20-L24), [paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts#L76-L98)
- Processor expects provider on job data but `initiateDeposit` enqueues `{ paymentId }` only (no provider).  
  - Evidence: [payments.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.service.ts#L49-L55), [payment.processor.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/queue-process/payment.processor.ts#L15-L23)
- **Webhook handler is missing** (no `@Controller` route for Paystack webhooks found; no signature verification code found).  
  - Evidence checked: controller scan list in section C and grep for signature patterns.

### MVP Paystack-first readiness status
- **Status**: `PARTIAL`  
  - initialize/verify code exists but is not reliably wired, and webhook reconcile is missing.

---

## F) Uploads + Documents

### What exists
- Cloudinary provider configured via env vars and injected into `UploadService`  
  - Evidence: [cloudinary.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/providers/cloudinary.provider.ts), [upload.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.service.ts)
- `UploadService.uploadFile()` validates mimetypes and persists a `FileUpload` record with `campaignId` and optional `userId`  
  - Evidence: [upload.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.service.ts#L15-L53)
- `FileUpload` Prisma model stores: `publicId`, `url`, `format`, `resourceType`, `sizeInBytes`, `originalName`, plus relations  
  - Evidence: [schema.prisma FileUpload](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L65-L83)

### What is partial/broken (confirmed)
- `UploadController` exists but is not mounted (`UploadModule.controllers = []`), so upload endpoints are unreachable via HTTP.  
  - Evidence: [upload.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.controller.ts), [upload.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.module.ts#L6-L9)
- There is no document categorization/visibility model:
  - No fields like `documentType`, `visibility`, `status`, `reviewedBy`, etc.
  - Therefore representing "medical proof" vs "beneficiary image (private)" is **not cleanly supported** today.
  - Evidence: [schema.prisma FileUpload](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L65-L83)

### MVP documents status
- **Status**: `PARTIAL` (upload + persistence exists, but no category/status/visibility and no reachable endpoints)

---

## G) Gaps vs Engineering Handbook (EXISTS / PARTIAL / MISSING)

This mapping is based only on code present in repo. The handbook itself is not stored in this repository, so the comparison is performed only against the explicit requirements listed in the prompt.

### Campaign submission (proxy + self)
- **PARTIAL**
  - Proxy fields exist in DTO and Prisma model (`proxyName`, `proxyPhone`, `proxyEmail`, etc.)  
    - Evidence: [schema.prisma Campaign](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L149-L155), [create-campaign.dto.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/dto/create-campaign.dto.ts#L51-L66)
  - Submission endpoint exists (`POST /campaign/create-user`) but service does not write to DB  
    - Evidence: [campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L15-L22), [campaign.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.service.ts#L16-L33)

### Admin verification queue + approve/reject/request-more-info
- **MISSING / PARTIAL**
  - There is a service method `approveCampaign()` but no controller route exposing it.  
    - Evidence: [campaign.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.service.ts#L134-L145)
  - There is a `POST /campaign/:id/verify` endpoint, but it enforces `USER_ROLES.PROXY` (not admin workflow) and does not handle approve/reject/more-info.  
    - Evidence: [campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L83-L91), [campaign.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.service.ts#L172-L198)

### Publish + campaign feed sorting rules
- **MISSING**
  - No `PUBLISHED` status in Prisma; no feed ranking logic found.  
    - Evidence: [schema.prisma CAMPAIGN_STATUS](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L110-L115)

### Paystack initialize + webhook reconcile (source of truth)
- **PARTIAL**
  - Provider code exists for initialize/verify.  
    - Evidence: [paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts)
  - No webhook handler route and no signature verification found; controller not mounted.  
    - Evidence: controller list section C; [payments.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.module.ts#L10-L22)

### Updates posting + visibility
- **MISSING**
  - No Updates module/controller/entities found.  
    - Evidence: `src/services/*` inventory; controller scan in section C.

### Dashboard summary (donor/creator/admin)
- **MISSING**
  - No Dashboard module/controller found.  
    - Evidence: module scan in section B; controller scan in section C.

---

## Top 10 Fixes (ranked P0 / P1 / P2)

### P0 (blocks correctness or security)
1. Fix auth enforcement on campaign routes (`campaigns` vs `campaign`), and replace fragile middleware routing with guards (JWT + roles).  
   - Evidence: [src/app.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/app.module.ts#L36-L40), [src/services/campaign/campaign.controller.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.controller.ts#L10-L13)
2. Configure cookie parsing if auth uses cookies (`cookie-parser` is installed but not wired).  
   - Evidence: [src/middleware/auth.middleware.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/middleware/auth.middleware.ts#L8-L16), [package.json](file:///Users/admin/Documents/ceeprel/torchlife_backend/package.json#L49)
3. Fix JWT expiration configuration mismatch (`JWT_EXPIRATION=1h` vs code expecting ms).  
   - Evidence: [env.example](file:///Users/admin/Documents/ceeprel/torchlife_backend/env.example#L22-L26), [token.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/token/token.service.ts#L13-L23)
4. Make campaign submission actually persist to DB and align DTO fields with Prisma (`record` vs `records[]`).  
   - Evidence: [create-campaign.dto.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/dto/create-campaign.dto.ts#L30-L33), [schema.prisma Campaign](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L127-L169), [campaign.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/campaign/campaign.service.ts#L16-L33)
5. Mount required controllers (PaymentsController, UploadController) or remove dead endpoints; currently they are unreachable.  
   - Evidence: [payments.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.module.ts#L10-L22), [upload.module.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/upload/upload.module.ts#L6-L9)

### P1 (major MVP feature gaps)
6. Implement Paystack webhook endpoint with signature verification and DB reconciliation; make webhook the source of truth as required.  
   - Evidence missing: no webhook controller in section C; `Webhook` model exists in Prisma.
7. Fix payments queue job naming and provider method signature mismatches so verify/reconcile actually runs.  
   - Evidence: [payments.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/payments.service.ts#L49-L55), [payment.processor.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/queue-process/payment.processor.ts#L15-L24), [paystack.provider.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/payments/inbound-providers/paystack.provider.ts#L76-L98)
8. Add document metadata model (type/visibility/status) to support medical proof vs private images cleanly.  
   - Evidence: FileUpload lacks these fields today: [schema.prisma FileUpload](file:///Users/admin/Documents/ceeprel/torchlife_backend/prisma/schema.prisma#L65-L83)

### P2 (cleanup / maintainability)
9. Remove duplicate/unused auth code (`src/auth/*`) to avoid confusion and drift; keep a single auth implementation.  
   - Evidence: [src/auth/auth.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/auth/auth.service.ts) vs [src/services/auth/auth.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/auth/auth.service.ts)
10. Remove sensitive debug logging (e.g., dumping all users on lookup failure) and replace with safe structured logs.  
   - Evidence: [user.service.ts](file:///Users/admin/Documents/ceeprel/torchlife_backend/src/services/user/user.service.ts#L12-L31)

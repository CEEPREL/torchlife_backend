--
-- PostgreSQL database dump
--

\restrict 8Z9D5fdjnbwdrlL0y0NF3mCXtzvafBxbHXW8YEsFvc5oJNU27DvbEbriUfTkN4n

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ACCOUNT_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ACCOUNT_STATUS" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."ACCOUNT_STATUS" OWNER TO postgres;

--
-- Name: CAMPAIGN_EXTENSION_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CAMPAIGN_EXTENSION_STATUS" AS ENUM (
    'NONE',
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."CAMPAIGN_EXTENSION_STATUS" OWNER TO postgres;

--
-- Name: CAMPAIGN_PRIORITY; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CAMPAIGN_PRIORITY" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."CAMPAIGN_PRIORITY" OWNER TO postgres;

--
-- Name: CAMPAIGN_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CAMPAIGN_STATUS" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."CAMPAIGN_STATUS" OWNER TO postgres;

--
-- Name: CURRENCY; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CURRENCY" AS ENUM (
    'NGN',
    'USD'
);


ALTER TYPE public."CURRENCY" OWNER TO postgres;

--
-- Name: CampaignCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CampaignCategory" AS ENUM (
    'URGENT',
    'MILESTONE',
    'OFFSET',
    'FIRSTFUND'
);


ALTER TYPE public."CampaignCategory" OWNER TO postgres;

--
-- Name: CampaignStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CampaignStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'CLOSED'
);


ALTER TYPE public."CampaignStatus" OWNER TO postgres;

--
-- Name: DOCUMENT_REQUEST_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DOCUMENT_REQUEST_STATUS" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."DOCUMENT_REQUEST_STATUS" OWNER TO postgres;

--
-- Name: DONATION_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DONATION_STATUS" AS ENUM (
    'PENDING',
    'FAILED',
    'REJECTED',
    'SUCCESS'
);


ALTER TYPE public."DONATION_STATUS" OWNER TO postgres;

--
-- Name: PAYMENT_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PAYMENT_STATUS" AS ENUM (
    'PENDING',
    'FAILED',
    'REJECTED',
    'SUCCESS'
);


ALTER TYPE public."PAYMENT_STATUS" OWNER TO postgres;

--
-- Name: PAYMENT_TYPE; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PAYMENT_TYPE" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'REFUND',
    'ADJUSTMENT'
);


ALTER TYPE public."PAYMENT_TYPE" OWNER TO postgres;

--
-- Name: SubmitterType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubmitterType" AS ENUM (
    'SELF',
    'PROXY'
);


ALTER TYPE public."SubmitterType" OWNER TO postgres;

--
-- Name: USER_ACTIVITIES; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."USER_ACTIVITIES" AS ENUM (
    'DONOR',
    'RECEIVER'
);


ALTER TYPE public."USER_ACTIVITIES" OWNER TO postgres;

--
-- Name: USER_ROLES; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."USER_ROLES" AS ENUM (
    'ADMIN',
    'USER',
    'SUPER_ADMIN',
    'PROXY'
);


ALTER TYPE public."USER_ROLES" OWNER TO postgres;

--
-- Name: WITHDRAWAL_STATUS; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WITHDRAWAL_STATUS" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public."WITHDRAWAL_STATUS" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Beneficiary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Beneficiary" (
    id text NOT NULL,
    name text NOT NULL,
    "countryOfResidence" text NOT NULL,
    "expectedDateOfDelivery" timestamp(3) without time zone NOT NULL,
    "medicalConditions" text[]
);


ALTER TABLE public."Beneficiary" OWNER TO postgres;

--
-- Name: CampaignDocument; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CampaignDocument" (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "mimeType" text NOT NULL,
    "isHero" boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    visibility text NOT NULL
);


ALTER TABLE public."CampaignDocument" OWNER TO postgres;

--
-- Name: CampaignUpdate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CampaignUpdate" (
    id text NOT NULL,
    "campaignId" text NOT NULL,
    message text NOT NULL,
    visibility text NOT NULL,
    "createdBy" text NOT NULL,
    status text DEFAULT 'PUBLISHED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CampaignUpdate" OWNER TO postgres;

--
-- Name: Campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Campaigns" (
    id text NOT NULL,
    title text NOT NULL,
    category public."CampaignCategory" NOT NULL,
    story text NOT NULL,
    "amountNeeded" double precision NOT NULL,
    "amountRaised" double precision DEFAULT 0 NOT NULL,
    currency text NOT NULL,
    status public."CampaignStatus" NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "submitterType" text NOT NULL,
    "beneficiaryId" text NOT NULL,
    "submitterId" text,
    "hospitalId" text NOT NULL,
    "consentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Campaigns" OWNER TO postgres;

--
-- Name: Consent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Consent" (
    id text NOT NULL,
    agreed boolean NOT NULL,
    "agreedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Consent" OWNER TO postgres;

--
-- Name: Hospital; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Hospital" (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL
);


ALTER TABLE public."Hospital" OWNER TO postgres;

--
-- Name: OtpToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OtpToken" (
    "pkId" integer NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OtpToken" OWNER TO postgres;

--
-- Name: OtpToken_pkId_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OtpToken_pkId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OtpToken_pkId_seq" OWNER TO postgres;

--
-- Name: OtpToken_pkId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OtpToken_pkId_seq" OWNED BY public."OtpToken"."pkId";


--
-- Name: Submitter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Submitter" (
    id text NOT NULL,
    name text NOT NULL,
    relationship text,
    phone text NOT NULL,
    email text NOT NULL
);


ALTER TABLE public."Submitter" OWNER TO postgres;

--
-- Name: WalletTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WalletTransaction" (
    id uuid NOT NULL,
    amount integer NOT NULL,
    type public."PAYMENT_TYPE" NOT NULL,
    currency public."CURRENCY" NOT NULL,
    status public."PAYMENT_STATUS" DEFAULT 'PENDING'::public."PAYMENT_STATUS" NOT NULL,
    reference text NOT NULL,
    description text,
    meta jsonb,
    wallet_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    payment_id uuid
);


ALTER TABLE public."WalletTransaction" OWNER TO postgres;

--
-- Name: WithdrawalRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WithdrawalRequest" (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    amount integer NOT NULL,
    status public."WITHDRAWAL_STATUS" NOT NULL,
    reason text,
    initiated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(3) without time zone,
    payment_id uuid
);


ALTER TABLE public."WithdrawalRequest" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: campaign_extension_audits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaign_extension_audits (
    id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    admin_id uuid NOT NULL,
    old_deadline timestamp(3) without time zone NOT NULL,
    new_deadline timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.campaign_extension_audits OWNER TO postgres;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id uuid NOT NULL,
    title text NOT NULL,
    certified_pdf text NOT NULL,
    image_url text NOT NULL,
    status public."CAMPAIGN_STATUS" DEFAULT 'PENDING'::public."CAMPAIGN_STATUS" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    user_id uuid NOT NULL,
    amount_raised integer DEFAULT 0 NOT NULL,
    deadline timestamp(3) without time zone NOT NULL,
    story text,
    target_amount integer NOT NULL,
    "proxyAddress" text,
    "proxyEmail" text,
    "proxyName" text,
    "proxyNote" text,
    "proxyPhone" text,
    type public."USER_ROLES" DEFAULT 'USER'::public."USER_ROLES" NOT NULL,
    batch integer DEFAULT 1 NOT NULL,
    location text,
    priority public."CAMPAIGN_PRIORITY" DEFAULT 'LOW'::public."CAMPAIGN_PRIORITY" NOT NULL,
    records text[],
    verified_by_id uuid NOT NULL,
    currency public."CURRENCY" DEFAULT 'NGN'::public."CURRENCY" NOT NULL,
    approval_email_sent boolean DEFAULT false NOT NULL,
    approved_at timestamp(3) without time zone,
    extension_status public."CAMPAIGN_EXTENSION_STATUS" DEFAULT 'NONE'::public."CAMPAIGN_EXTENSION_STATUS" NOT NULL,
    requested_deadline timestamp(3) without time zone,
    extension_requested_at timestamp(3) without time zone,
    extension_reviewed_at timestamp(3) without time zone,
    public_id text NOT NULL,
    deleted_by_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    approved_by_id uuid,
    approval_notes text,
    hospital_name text,
    hospital_contact text,
    hospital_contact_person_name text
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    id uuid NOT NULL,
    amount integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    user_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    status public."DONATION_STATUS" DEFAULT 'PENDING'::public."DONATION_STATUS" NOT NULL,
    donor_email text,
    is_anonymous boolean DEFAULT false NOT NULL
);


ALTER TABLE public.donations OWNER TO postgres;

--
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.file_uploads (
    id uuid NOT NULL,
    "publicId" text NOT NULL,
    url text NOT NULL,
    format text NOT NULL,
    "resourceType" text NOT NULL,
    "sizeInBytes" integer NOT NULL,
    "originalName" text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" uuid,
    "campaignId" uuid NOT NULL,
    "mimeType" text
);


ALTER TABLE public.file_uploads OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    amount integer NOT NULL,
    synced_at timestamp(3) without time zone,
    tx_ref text NOT NULL,
    custom_tx_ref text NOT NULL,
    status public."PAYMENT_STATUS" NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    donation_id uuid,
    user_id uuid,
    currency public."CURRENCY" NOT NULL,
    type public."PAYMENT_TYPE" NOT NULL,
    meta jsonb,
    wallet_id uuid,
    provider text,
    donor_email text,
    payment_channel text,
    paystack_transaction_id bigint,
    verified_at timestamp(3) without time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id uuid NOT NULL,
    score integer NOT NULL,
    comment text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    user_id uuid NOT NULL,
    campaign_id uuid NOT NULL
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: supporting_document_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supporting_document_requests (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp(3) without time zone,
    reviewed_by_id uuid,
    status public."DOCUMENT_REQUEST_STATUS" DEFAULT 'PENDING'::public."DOCUMENT_REQUEST_STATUS" NOT NULL
);


ALTER TABLE public.supporting_document_requests OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    activities public."USER_ACTIVITIES",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    phone_number text,
    isverified boolean NOT NULL,
    role public."USER_ROLES" DEFAULT 'USER'::public."USER_ROLES",
    "refreshToken" text,
    marketing_metadata jsonb,
    last_marketing_sync_at timestamp(3) without time zone,
    philanthropic_name text NOT NULL,
    impact_score integer DEFAULT 0 NOT NULL,
    emergencies_supported integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallets (
    id uuid NOT NULL,
    balance integer NOT NULL,
    user_id uuid,
    currency public."CURRENCY" DEFAULT 'NGN'::public."CURRENCY" NOT NULL,
    campaign_id uuid,
    account_status public."ACCOUNT_STATUS" DEFAULT 'ACTIVE'::public."ACCOUNT_STATUS" NOT NULL
);


ALTER TABLE public.wallets OWNER TO postgres;

--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhooks (
    id uuid NOT NULL,
    event jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    payment_id uuid,
    event_type text,
    reference text,
    paystack_event_id text
);


ALTER TABLE public.webhooks OWNER TO postgres;

--
-- Name: OtpToken pkId; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OtpToken" ALTER COLUMN "pkId" SET DEFAULT nextval('public."OtpToken_pkId_seq"'::regclass);


--
-- Data for Name: Beneficiary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Beneficiary" (id, name, "countryOfResidence", "expectedDateOfDelivery", "medicalConditions") FROM stdin;
\.


--
-- Data for Name: CampaignDocument; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CampaignDocument" (id, "campaignId", "fileName", "fileUrl", "mimeType", "isHero", type, visibility) FROM stdin;
\.


--
-- Data for Name: CampaignUpdate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CampaignUpdate" (id, "campaignId", message, visibility, "createdBy", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Campaigns" (id, title, category, story, "amountNeeded", "amountRaised", currency, status, verified, "submitterType", "beneficiaryId", "submitterId", "hospitalId", "consentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Consent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Consent" (id, agreed, "agreedAt") FROM stdin;
\.


--
-- Data for Name: Hospital; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Hospital" (id, name, phone, address) FROM stdin;
\.


--
-- Data for Name: OtpToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OtpToken" ("pkId", token, "userId", "expiryDate") FROM stdin;
1	$2b$10$5P7HYWQkzaqQjLJtEsGVNuZh1mUzmW7FViMDoEofuR9pRe8nSoWY6	6011f538-f34c-469f-a11f-338d44d1f5d0	2026-06-13 06:03:25.197
2	$2b$10$5S4tJkxm7J5o0N794aO80u3WK1P2IJFXbMz3fhYzlz2CVZI1/mjC6	6011f538-f34c-469f-a11f-338d44d1f5d0	2026-06-14 11:17:34.656
3	$2b$10$JHWEKQjWdqC7pD/J.tE7vOOw.uypQSTh1d98rZzn4JO3jAxpMm9qa	19cc08cc-fd26-474c-afe7-37de5bbce0a9	2026-06-16 19:20:39.282
4	$2b$10$MJg47Puod/NFMcLhGpy1pOcwvKgASfbR9nDlbVPyTLqA1SCGSRc7C	f0d61cdb-9f7e-42a4-b9b0-5c1032928e01	2026-06-16 19:21:22.783
5	$2b$10$k7UFe.91mOdiSvPOb/29.uEbrDRJtaKYTHXRS3JNM8XxV6iC3B4uW	b0a00d75-ed14-48b3-9b91-3524cd787a62	2026-06-16 22:01:29.979
6	$2b$10$rSnNpxgnAvq/cDFs9KHUIuw223Q37okTwOL8ORRyhcsRSSEHNauHq	410862b3-40c8-49d7-89b4-2bf2b50328f4	2026-06-17 11:28:01.612
7	$2b$10$gcaHyhY/lyALCTob38xZK.uCvOeDGzMr7aslDgMF7eW6sZNErDcCy	410862b3-40c8-49d7-89b4-2bf2b50328f4	2026-06-17 12:12:43.441
8	$2b$10$aIODw.PfgeSHjAvtbZV40ude74NhIRQLFB8deCF6DPXNPtBy5kq3G	f3a0c854-dc17-4f35-85b1-233af3285a50	2026-06-17 13:49:47.05
9	$2b$10$r2xGhEHEk9zYoWhej1JsWePGXtkR52JI2hz09GGysUupp47lN6ike	46cb1608-ff1a-4d22-9dfd-9441da8927da	2026-06-17 13:56:26.163
11	$2b$10$MbYiQhO9CRHpUgQh5O4luubglmpZfHkgh96eUM0kd2gILQ3RU88Ia	46cb1608-ff1a-4d22-9dfd-9441da8927da	2026-06-17 14:57:42.878
\.


--
-- Data for Name: Submitter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Submitter" (id, name, relationship, phone, email) FROM stdin;
\.


--
-- Data for Name: WalletTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WalletTransaction" (id, amount, type, currency, status, reference, description, meta, wallet_id, created_at, updated_at, payment_id) FROM stdin;
\.


--
-- Data for Name: WithdrawalRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WithdrawalRequest" (id, user_id, wallet_id, amount, status, reason, initiated_at, processed_at, payment_id) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
29f301d3-c8ff-41a6-903a-31d94db94bfe	0d549e250406696e48c78a031c32613b4015298e9c6b663ab4feed39e583a564	2026-06-13 05:22:29.377684+00	20250528230939_init	\N	\N	2026-06-13 05:22:29.303277+00	1
96af77b7-bf2d-4db4-9983-f9061f37ec80	538e865ce6bf361ed58e823bd39490a0f4ac0ba73e32c158904277b003596ff3	2026-06-13 05:22:29.458405+00	20250925111858_added_currency	\N	\N	2026-06-13 05:22:29.433025+00	1
8bfba29f-e057-4417-beeb-b0522d0fb46b	4c3fa169ef2154e439d273611f568d4e8ee6465ae52fe49941e82e36f63c0b09	2026-06-13 05:22:29.382011+00	20250529000211_init	\N	\N	2026-06-13 05:22:29.378086+00	1
f989322a-4f7a-4a14-8d6a-b4327b769604	f3973f28b98b487899b580b098d569f7cd0ac3d89002fdb418e5590bede16f9f	2026-06-13 05:22:29.387982+00	20250607135823_init	\N	\N	2026-06-13 05:22:29.382284+00	1
4ff31e4c-3e9d-4142-a6d0-e8fb99e1706e	03229f429d21b4089be9cc85af9ce1204cd6eb74ed010a478eaf2b8450b4f1dc	2026-06-13 05:22:29.389326+00	20250620054810_inside	\N	\N	2026-06-13 05:22:29.388264+00	1
d2795847-76ec-42a6-9b34-231b94f16d80	cb80621064ca1bfc6cb87f0b8bf39c616c948bcf24237850e44800368e38f0db	2026-06-13 05:22:29.468854+00	20251002112151_payment_update	\N	\N	2026-06-13 05:22:29.458689+00	1
87b28b85-e398-4b63-8031-1fdd4ebe448f	597e0fd69e425da294e54eb28d4a110706331df4de59c0a32e5748fc6d9f5cb0	2026-06-13 05:22:29.391347+00	20250805144203_added_is_verified	\N	\N	2026-06-13 05:22:29.389604+00	1
23945816-b1f3-4227-8514-94d73939ed25	5fca0561d1c8f3400156827aa986890dec3426710ae84182b89117a4592e3671	2026-06-13 05:22:29.403861+00	20250906235400_add_file_upload_relation	\N	\N	2026-06-13 05:22:29.391627+00	1
7f9e970b-a4ef-4d84-8ad9-395fa2be5e88	f8e5c577c1961f9d5c34eda1213c33836d40033bd9f12faf1f2f6b7127172b51	2026-06-15 17:24:55.545276+00	20260614113000_marketing_paystack_email_updates	\N	\N	2026-06-15 17:24:55.495932+00	1
d33dd2d6-647e-4586-8c44-5df57adbc5fc	fb2862df16e76c60c065e94dd044b6f770e8c0f33d4dbb712b5178868b97e5e3	2026-06-13 05:22:29.410769+00	20250909062348_added_proxy	\N	\N	2026-06-13 05:22:29.40424+00	1
80f27ce3-60ba-4455-8008-cb637304d27c	5bcd0b9111f83f1077302c479ca366200404378361ad8208af4c5bd95400c226	2026-06-13 05:22:29.473868+00	20251002133503_update_acctout_status	\N	\N	2026-06-13 05:22:29.469138+00	1
312d5a56-b68f-4593-a98b-9c7b77f98467	102887f3f36d837fafd316af5c6c34a5b27d21eb6d48c97261623410c6ae2112	2026-06-13 05:22:29.412196+00	20250909084811_added_proxy	\N	\N	2026-06-13 05:22:29.411068+00	1
763e949c-18e7-4341-b99c-9472542e8e6e	fb7efb47c6c545c0772b82157fb3903658cd9de9395feaf1c8a9a370e53f6030	2026-06-13 05:22:29.41501+00	20250922003222_added_new_fields_to_campaign	\N	\N	2026-06-13 05:22:29.412469+00	1
cadc739c-e183-46b9-96f4-ca7990343880	ba59988e255c11ad9a99244c416624ec3391f0950290b7207ed0a73d7cec5e00	2026-06-13 05:22:29.416564+00	20250922101009_update_campaign_schema_record	\N	\N	2026-06-13 05:22:29.415326+00	1
6fd8720d-b2d4-4969-a34f-6e93ec74cc51	22072e5459a0d2320a8e7c55ae14fbfe5fa022ece1a73aa24de056d034f8ca32	2026-06-13 05:22:29.475017+00	20251006193818_	\N	\N	2026-06-13 05:22:29.474107+00	1
9db6b9ea-157a-46b7-b10d-6bc35b6b689e	6d7ebe6d754261d996131054f5c420963a9434c5ff33f0263d333999a346e275	2026-06-13 05:22:29.425784+00	20250922150046_added_new_fields_to_oranization	\N	\N	2026-06-13 05:22:29.416828+00	1
e6ce96b0-535d-49e9-a46a-85427c181557	cdddd56c777dcb36bfdedac7a0e814726e938295c6b8c69902abe33265258806	2026-06-13 05:22:29.430344+00	20250924082740_added_new_fields_to_oranization	\N	\N	2026-06-13 05:22:29.426096+00	1
88798260-b8a1-45f7-9963-7116423b4cac	e698e94cc3012f4455a294c27a2f7311ec0b422541847197e2db64ed0d9752ff	2026-06-13 05:22:29.432733+00	20250924084134_added_verify_by_oranization	\N	\N	2026-06-13 05:22:29.430634+00	1
1373023b-8700-4a82-b7d9-c5961fa93674	f743268aa52fd853449e778c6d1675f8d315972dec61bbddcda3888720a47697	2026-06-13 05:22:29.475974+00	20251006194028_added_provider	\N	\N	2026-06-13 05:22:29.47524+00	1
ff1f45e5-bd77-49a6-8e8f-af856d8ababb	70985cec3d38ec21a7ec4844dc73aa8ce5a3ac5966408d300fe9b6e7dad12af4	2026-06-16 23:13:41.273879+00	20260616190500_make_user_phone_optional	\N	\N	2026-06-16 23:13:41.26363+00	1
dd4e85a2-660d-4e3c-89f5-3e68f4db52a0	3bdf5d8b2afa8dad704a4cc7a4f6eecf9fc6684014dc3cbd34516c9b954a82d1	2026-06-13 05:22:29.476978+00	20251006194256_payment_edit	\N	\N	2026-06-13 05:22:29.476231+00	1
7452e5a4-f462-49bd-ab0f-923ffc364110	c5aef056df25c256d30ef59c96b0fa07eef78d9c46d45fcb26f7b6d55c14e5c0	2026-06-13 05:22:29.48863+00	20251009040409_init	\N	\N	2026-06-13 05:22:29.477236+00	1
57f49591-ead4-44a4-aa54-c7ee12963500	8d9974e389fda71b5b5b73d432f64c683a44fc662b4dd79e1a3766b0f1b530b9	2026-06-13 05:22:29.489607+00	20251130090130_refresh	\N	\N	2026-06-13 05:22:29.488864+00	1
0e71e948-b247-42c3-b612-c2b93575a329	206df6b809b13afccc4a9c820647d77d79134df5a06e8e6e460befd68800bc97	2026-06-17 13:39:14.772188+00	20260617110000_campaign_extension_request	\N	\N	2026-06-17 13:39:14.735427+00	1
400f7da6-df5a-4d2a-8f6e-67569598bd34	fa74a24b6738a92a089232dd5a2dc00bfc370c9a221d5a8f7c521b1ea1f9d93d	2026-06-13 05:22:29.539614+00	20260604142612_add_mimetype	\N	\N	2026-06-13 05:22:29.489902+00	1
d8e86819-c96c-42fe-bebe-1f15c8828444	285d55c18ba3d436af894588a70fdbb7d8cdbc18add99a46166e328feec0d02d	2026-06-17 14:53:14.571034+00	20260617133000_user_philanthropic_name_unique	\N	\N	2026-06-17 14:53:14.547821+00	1
c0bb1153-af53-4d0f-bb68-ecae2fe23dc9	d38a67156f46f977196c1b9ba6bb412f188f609e77a17c77f1e4c576240302f4	\N	20260617180000_campaign_soft_delete_and_impact_score	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260617180000_campaign_soft_delete_and_impact_score\n\nDatabase error code: 42883\n\nDatabase error:\nERROR: function md5(uuid) does not exist\nHINT: No function matches the given name and argument types. You might need to add explicit type casts.\n\nPosition:\n[1m 14[0m\n[1m 15[0m UPDATE "campaigns"\n[1m 16[0m SET "public_id" = CONCAT(\n[1m 17[0m   COALESCE(NULLIF(REGEXP_REPLACE(LOWER("title"), '[^a-z0-9]+', '-', 'g'), ''), 'campaign'),\n[1m 18[0m   '-',\n[1m 19[1;31m   SUBSTRING(MD5("id") FROM 1 FOR 8)[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42883), message: "function md5(uuid) does not exist", detail: None, hint: Some("No function matches the given name and argument types. You might need to add explicit type casts."), position: Some(Original(701)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_func.c"), line: Some(629), routine: Some("ParseFuncOrColumn") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260617180000_campaign_soft_delete_and_impact_score"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260617180000_campaign_soft_delete_and_impact_score"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:260	2026-06-18 11:11:28.535224+00	2026-06-18 10:33:56.380817+00	0
52ed5356-9d19-473f-bc0b-f41757d3a79d	ce9b6f7424454ee119d01b7827c56b88a0f552c26157e531fd4e92d9665c3480	2026-06-18 11:11:36.747942+00	20260617180000_campaign_soft_delete_and_impact_score	\N	\N	2026-06-18 11:11:36.711977+00	1
b4910725-ebad-4daf-bfb1-4790fb559b8b	bd3f18663a8790e30a22cd39d9196d03e35c715a8b6f6deba7443028ea3127c2	2026-06-21 00:41:03.727132+00	20260618150000_platform_hardening	\N	\N	2026-06-21 00:41:03.694321+00	1
b4f9b2e7-4f85-4c8b-a20b-8e41e48e2560	23077a1c3b938ac0056566b146791dea10cb909bbe4c2b933e9156cc2346fe87	2026-06-21 00:41:03.728684+00	20260621093000_campaign_hospital_contact_person	\N	\N	2026-06-21 00:41:03.727425+00	1
\.


--
-- Data for Name: campaign_extension_audits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaign_extension_audits (id, campaign_id, admin_id, old_deadline, new_deadline, created_at) FROM stdin;
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaigns (id, title, certified_pdf, image_url, status, created_at, updated_at, deleted_at, user_id, amount_raised, deadline, story, target_amount, "proxyAddress", "proxyEmail", "proxyName", "proxyNote", "proxyPhone", type, batch, location, priority, records, verified_by_id, currency, approval_email_sent, approved_at, extension_status, requested_deadline, extension_requested_at, extension_reviewed_at, public_id, deleted_by_id, is_deleted, approved_by_id, approval_notes, hospital_name, hospital_contact, hospital_contact_person_name) FROM stdin;
0fc18f7c-0b46-4b40-8156-01b5c6f31614	A Pregnancy Emergency Changed Everything For Abigail	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1782007872/torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/uksecwxupesgmzpvbhp9.pdf	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1782007870/torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/mpfgkdlkdsry8lfcfexs.jpg	APPROVED	2026-06-21 02:11:06.34	2026-06-21 02:41:36.061	\N	e41d031e-865b-48b7-acf4-af164ef04a62	0	2026-06-23 00:00:00	A Pregnancy Emergency Changed Everything For Abigail	500000	\N	Bolutifegboola@gmail.com	Abigail	\N	09074883778	PROXY	1	Olaolu Hos, 18 Ogudu road, Ojota, Lagos	LOW	{https://res.cloudinary.com/dhm6pzqpj/image/upload/v1782007875/torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/ixu3gx7g8tq3fmqeca3o.jpg}	e41d031e-865b-48b7-acf4-af164ef04a62	NGN	t	2026-06-21 02:41:36.057	NONE	\N	\N	\N	cmqn5h1pg0001ry5hpeuchxqu	\N	f	e41d031e-865b-48b7-acf4-af164ef04a62	\N	Olaolu Hos	0908499882	Boluwatife Agboola
e41720b0-1812-4d29-897b-10ead242f355	A Complication Changed Everything For Amaka			PENDING	2026-06-17 14:50:07.364	2026-06-17 14:50:07.364	\N	3e92f791-bd56-49b3-a986-551497f68b0a	0	2026-07-17 00:00:00	A Complication Changed Everything For Amaka	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital details to be updated."}	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	f	\N	NONE	\N	\N	\N	a-complication-changed-everything-for-amaka-e41720b0	\N	f	\N	\N	\N	\N	\N
ad1ba232-0631-4111-af4f-99c54ba831cc	A Complication Changed Everything For Amaka			PENDING	2026-06-17 14:51:09.265	2026-06-17 14:51:09.265	\N	3e92f791-bd56-49b3-a986-551497f68b0a	0	2026-07-17 00:00:00	A Complication Changed Everything For Amaka	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital: Boluwatife | Address: Agboola | Doctor: A Complication Changed Everything For Amaka"}	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	f	\N	NONE	\N	\N	\N	a-complication-changed-everything-for-amaka-ad1ba232	\N	f	\N	\N	\N	\N	\N
d7965444-8f5c-4013-8125-1fcc0b3ab6ce	The Unexpected Happened To Chioma			APPROVED	2026-06-17 14:56:15.254	2026-06-17 19:32:20.08	\N	3e92f791-bd56-49b3-a986-551497f68b0a	0	2026-07-19 00:00:00	The Unexpected Happened To Chioma	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital: Boluwatife | Address: Agboola | Doctor: The Unexpected Happened To Chioma | Diagnosis: The Unexpected Happened To Chioma"}	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	t	2026-06-17 19:32:20.078	NONE	\N	\N	\N	the-unexpected-happened-to-chioma-d7965444	\N	f	\N	\N	\N	\N	\N
94fc78db-7525-4d19-b6bf-d917c96e055c	God is able			APPROVED	2026-06-17 21:53:31.161	2026-06-21 14:35:47.115	\N	e41d031e-865b-48b7-acf4-af164ef04a62	155850	2026-07-19 00:00:00	A Complication Changed Everything For Amaka	500000	\N	\N	\N	Ogo-Oluwa Hospital	\N	USER	1	lagos	MEDIUM	{"Hospital: wtyuioolkjh | Address: Agboola | Doctor: fghjk | Diagnosis: rtyui"}	e41d031e-865b-48b7-acf4-af164ef04a62	NGN	t	2026-06-18 07:52:53.718	NONE	\N	\N	\N	wertyuiokjhg-94fc78db	\N	f	e41d031e-865b-48b7-acf4-af164ef04a62	\N	Ogo-Oluwa Hospital	08099999999	Ogo-Oluwa Hospital
e9c7404c-cef1-4ceb-bcd3-c4525759b2b5	wertyuiokjhg			APPROVED	2026-06-17 21:52:58.055	2026-06-18 09:44:39.596	\N	e41d031e-865b-48b7-acf4-af164ef04a62	0	2026-07-19 00:00:00	A Complication Changed Everything For Amaka	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital: wtyuioolkjh | Address: Agboola | Doctor: fghjk | Diagnosis: rtyui"}	e41d031e-865b-48b7-acf4-af164ef04a62	NGN	t	2026-06-18 09:44:39.594	NONE	\N	\N	\N	wertyuiokjhg-e9c7404c	\N	f	\N	\N	\N	\N	\N
b9a14119-4216-4341-9d47-2cf2c936099e	A Complication Changed Everything For Amaka			APPROVED	2026-06-17 14:53:38.725	2026-06-18 09:44:45.674	\N	3e92f791-bd56-49b3-a986-551497f68b0a	0	2026-07-17 00:00:00	A Complication Changed Everything For Amaka	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital: Boluwatife | Address: Agboola | Doctor: A Complication Changed Everything For Amaka"}	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	t	2026-06-18 09:44:45.672	NONE	\N	\N	\N	a-complication-changed-everything-for-amaka-b9a14119	\N	f	\N	\N	\N	\N	\N
d4156d52-ee29-41dd-a1fe-7006b5896594	wertyuiokjhg			APPROVED	2026-06-17 21:54:17.349	2026-06-20 21:54:27.238	2026-06-20 21:54:27.236	e41d031e-865b-48b7-acf4-af164ef04a62	0	2026-07-19 00:00:00	A Complication Changed Everything For Amaka	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital: wtyuioolkjh | Address: Agboola | Doctor: fghjk | Diagnosis: rtyui"}	e41d031e-865b-48b7-acf4-af164ef04a62	NGN	t	2026-06-17 21:55:06.342	NONE	\N	\N	\N	wertyuiokjhg-d4156d52	e41d031e-865b-48b7-acf4-af164ef04a62	t	\N	\N	\N	\N	\N
e288199d-e971-4fef-92a1-c9aca615751f	A Complication Changed Everything For Amaka			PENDING	2026-06-17 21:50:59.083	2026-06-21 01:24:47.443	2026-06-21 01:24:47.442	e41d031e-865b-48b7-acf4-af164ef04a62	0	2026-07-18 00:00:00	A Complication Changed Everything For AmakaA Complication Changed Everything For AmakaA Complication Changed Everything For Amaka	500000	\N	\N	\N	\N	\N	USER	1	\N	LOW	{"Hospital: Boluwatife | Address: Agboola | Doctor: A Complication Changed Everything For Amaka | Diagnosis: A Complication Changed Everything For Amaka"}	e41d031e-865b-48b7-acf4-af164ef04a62	NGN	f	\N	NONE	\N	\N	\N	a-complication-changed-everything-for-amaka-e288199d	e41d031e-865b-48b7-acf4-af164ef04a62	t	\N	\N	\N	\N	\N
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donations (id, amount, created_at, updated_at, deleted_at, user_id, campaign_id, status, donor_email, is_anonymous) FROM stdin;
e0eb1b28-989a-4c84-98b7-35dc2e4e164f	10000	2026-06-20 21:56:27.508	2026-06-20 21:56:27.508	\N	3e92f791-bd56-49b3-a986-551497f68b0a	94fc78db-7525-4d19-b6bf-d917c96e055c	PENDING	qopeficenet@web-library.net	f
b454fff4-4c0b-40c7-8373-9860fe49fa4c	50000	2026-06-20 22:18:55.939	2026-06-20 22:18:55.939	\N	3e92f791-bd56-49b3-a986-551497f68b0a	94fc78db-7525-4d19-b6bf-d917c96e055c	PENDING	qopeficenet@web-library.net	f
f0e2a03c-ae9f-4e01-b02d-9f08a2afef43	100000	2026-06-21 01:18:02.154	2026-06-21 01:18:02.154	\N	3e92f791-bd56-49b3-a986-551497f68b0a	94fc78db-7525-4d19-b6bf-d917c96e055c	PENDING	qopeficenet@web-library.net	f
0b02af56-aec1-4185-9391-9be48ecbb360	10000	2026-06-21 02:01:07.191	2026-06-21 02:01:25.85	\N	573c87c3-aa1a-4ba4-9458-96bf52ec4da2	94fc78db-7525-4d19-b6bf-d917c96e055c	SUCCESS	bolutifegboola@gmail.com	f
632bfd35-464b-4ef6-bb8e-c8a4f6b7f471	100000	2026-06-21 13:52:52.724	2026-06-21 13:53:13.9	\N	573c87c3-aa1a-4ba4-9458-96bf52ec4da2	94fc78db-7525-4d19-b6bf-d917c96e055c	SUCCESS	\N	t
c76379c4-843c-4b62-839a-be04c2bc98b0	50000	2026-06-21 14:35:32.816	2026-06-21 14:35:47.113	\N	e41d031e-865b-48b7-acf4-af164ef04a62	94fc78db-7525-4d19-b6bf-d917c96e055c	SUCCESS	admin@torchlife.co	f
\.


--
-- Data for Name: file_uploads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.file_uploads (id, "publicId", url, format, "resourceType", "sizeInBytes", "originalName", "uploadedAt", "userId", "campaignId", "mimeType") FROM stdin;
6738866c-08bc-410c-a73c-35c2ae8d767b	torchlife/campaigns/e288199d-e971-4fef-92a1-c9aca615751f/oqjs2ida7a0jfm32evzp	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733100/torchlife/campaigns/e288199d-e971-4fef-92a1-c9aca615751f/oqjs2ida7a0jfm32evzp.jpg	jpg	image	2260051	jeferson-santu-a-aMurFiixo-unsplash.jpg	2026-06-17 21:51:41.054	e41d031e-865b-48b7-acf4-af164ef04a62	e288199d-e971-4fef-92a1-c9aca615751f	image/jpeg
3f10cf87-c81d-4145-b25f-49975434fc91	torchlife/campaigns/e288199d-e971-4fef-92a1-c9aca615751f/ljez8cstcz0kenftmrse	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733101/torchlife/campaigns/e288199d-e971-4fef-92a1-c9aca615751f/ljez8cstcz0kenftmrse.pdf	pdf	image	2243	TorchLife_Media_Event_Budget.pdf	2026-06-17 21:51:42.881	e41d031e-865b-48b7-acf4-af164ef04a62	e288199d-e971-4fef-92a1-c9aca615751f	application/pdf
364868d6-b31a-4af6-a0bc-fe229c526a0b	torchlife/campaigns/e288199d-e971-4fef-92a1-c9aca615751f/cs2xghvq0kzwmpnm6eyt	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733138/torchlife/campaigns/e288199d-e971-4fef-92a1-c9aca615751f/cs2xghvq0kzwmpnm6eyt.jpg	jpg	image	1102790	mustafa-omar-tEz8JU1j-00-unsplash.jpg	2026-06-17 21:52:19.446	e41d031e-865b-48b7-acf4-af164ef04a62	e288199d-e971-4fef-92a1-c9aca615751f	image/jpeg
865f45ee-d971-45de-b4b8-93f8e77733b4	torchlife/campaigns/94fc78db-7525-4d19-b6bf-d917c96e055c/xl3t1hr9zjn6au6izcou	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733223/torchlife/campaigns/94fc78db-7525-4d19-b6bf-d917c96e055c/xl3t1hr9zjn6au6izcou.jpg	jpg	image	1102790	mustafa-omar-tEz8JU1j-00-unsplash.jpg	2026-06-17 21:53:43.864	e41d031e-865b-48b7-acf4-af164ef04a62	94fc78db-7525-4d19-b6bf-d917c96e055c	image/jpeg
d5602271-1341-4815-953b-77999c5500a8	torchlife/campaigns/94fc78db-7525-4d19-b6bf-d917c96e055c/kroz7wr9ju0dyec2xmsi	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733224/torchlife/campaigns/94fc78db-7525-4d19-b6bf-d917c96e055c/kroz7wr9ju0dyec2xmsi.pdf	pdf	image	2243	TorchLife_Media_Event_Budget.pdf	2026-06-17 21:53:45.083	e41d031e-865b-48b7-acf4-af164ef04a62	94fc78db-7525-4d19-b6bf-d917c96e055c	application/pdf
6384fa0f-573c-49b1-8e98-b31410703797	torchlife/campaigns/d4156d52-ee29-41dd-a1fe-7006b5896594/y5wud4cvqheqdrzcbzz0	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733262/torchlife/campaigns/d4156d52-ee29-41dd-a1fe-7006b5896594/y5wud4cvqheqdrzcbzz0.jpg	jpg	image	1102790	mustafa-omar-tEz8JU1j-00-unsplash.jpg	2026-06-17 21:54:22.901	e41d031e-865b-48b7-acf4-af164ef04a62	d4156d52-ee29-41dd-a1fe-7006b5896594	image/jpeg
d966a185-d479-45cd-bd67-c00b0203d43a	torchlife/campaigns/d4156d52-ee29-41dd-a1fe-7006b5896594/elkc3amwdnzfxqwa0eil	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1781733263/torchlife/campaigns/d4156d52-ee29-41dd-a1fe-7006b5896594/elkc3amwdnzfxqwa0eil.pdf	pdf	image	2243	TorchLife_Media_Event_Budget.pdf	2026-06-17 21:54:23.861	e41d031e-865b-48b7-acf4-af164ef04a62	d4156d52-ee29-41dd-a1fe-7006b5896594	application/pdf
d9433705-1f38-4c8f-961e-2296e1a9c156	torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/mpfgkdlkdsry8lfcfexs	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1782007870/torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/mpfgkdlkdsry8lfcfexs.jpg	jpg	image	1102790	mustafa-omar-tEz8JU1j-00-unsplash.jpg	2026-06-21 02:11:11.065	e41d031e-865b-48b7-acf4-af164ef04a62	0fc18f7c-0b46-4b40-8156-01b5c6f31614	image/jpeg
6f19fd49-a6a2-4117-b953-860525cbd196	torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/uksecwxupesgmzpvbhp9	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1782007872/torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/uksecwxupesgmzpvbhp9.pdf	pdf	image	66932	15 Things I Evaluate Before Investing in a Founder.docx.pdf	2026-06-21 02:11:13.228	e41d031e-865b-48b7-acf4-af164ef04a62	0fc18f7c-0b46-4b40-8156-01b5c6f31614	application/pdf
ac84a0ab-6e0a-43df-9575-056608375cea	torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/ixu3gx7g8tq3fmqeca3o	https://res.cloudinary.com/dhm6pzqpj/image/upload/v1782007875/torchlife/campaigns/0fc18f7c-0b46-4b40-8156-01b5c6f31614/ixu3gx7g8tq3fmqeca3o.jpg	jpg	image	686017	wisdom-praize-tb2xLPxyvXY-unsplash.jpg	2026-06-21 02:11:15.515	e41d031e-865b-48b7-acf4-af164ef04a62	0fc18f7c-0b46-4b40-8156-01b5c6f31614	image/jpeg
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, amount, synced_at, tx_ref, custom_tx_ref, status, comment, created_at, updated_at, deleted_at, donation_id, user_id, currency, type, meta, wallet_id, provider, donor_email, payment_channel, paystack_transaction_id, verified_at) FROM stdin;
6ea134d6-ef13-4965-9aa2-5f3516ea6d70	10000	\N	torchlife-1781992583770-9ccb9e1a6d74	e0eb1b28-989a-4c84-98b7-35dc2e4e164f	PENDING	\N	2026-06-20 21:56:27.516	2026-06-20 21:56:27.516	\N	e0eb1b28-989a-4c84-98b7-35dc2e4e164f	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	DEPOSIT	{"metadata": {"donorId": "3e92f791-bd56-49b3-a986-551497f68b0a", "platform": "TorchLife", "anonymous": false, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "qopeficenet@web-library.net", "campaignTitle": "wertyuiokjhg"}, "initialization": {"accessCode": "xohv1cfla3z2wbw", "authorizationUrl": "https://checkout.paystack.com/xohv1cfla3z2wbw"}}	\N	paystack	qopeficenet@web-library.net	\N	\N	\N
c16ef5ec-eaa4-419b-9d9b-f06be01c81df	50000	\N	torchlife-1781993934578-9e843eebaaa1	b454fff4-4c0b-40c7-8373-9860fe49fa4c	PENDING	\N	2026-06-20 22:18:55.947	2026-06-20 22:18:55.947	\N	b454fff4-4c0b-40c7-8373-9860fe49fa4c	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	DEPOSIT	{"metadata": {"donorId": "3e92f791-bd56-49b3-a986-551497f68b0a", "platform": "TorchLife", "anonymous": false, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "qopeficenet@web-library.net", "campaignTitle": "wertyuiokjhg"}, "initialization": {"accessCode": "ijxqx5jbx08tmvi", "authorizationUrl": "https://checkout.paystack.com/ijxqx5jbx08tmvi"}}	\N	paystack	qopeficenet@web-library.net	\N	\N	\N
9b699cf7-b9dd-4c12-868a-7d9353cefe40	103200	\N	torchlife-1782004680410-8a4d9d837a2c	f0e2a03c-ae9f-4e01-b02d-9f08a2afef43	PENDING	\N	2026-06-21 01:18:02.165	2026-06-21 01:18:02.165	\N	f0e2a03c-ae9f-4e01-b02d-9f08a2afef43	3e92f791-bd56-49b3-a986-551497f68b0a	NGN	DEPOSIT	{"metadata": {"donorId": "3e92f791-bd56-49b3-a986-551497f68b0a", "platform": "TorchLife", "anonymous": false, "tipAmount": 500, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "qopeficenet@web-library.net", "platformFee": 2700, "totalCharged": 103200, "campaignTitle": "God is able", "donationAmount": 100000}, "initialization": {"accessCode": "jwpr0bpzlslj4m7", "authorizationUrl": "https://checkout.paystack.com/jwpr0bpzlslj4m7"}}	\N	paystack	qopeficenet@web-library.net	\N	\N	\N
8cb76e8d-8ac0-4233-b8db-f41ec26e18e2	10450	2026-06-21 02:01:25.83	torchlife-1782007264743-824db44b3ae7	0b02af56-aec1-4185-9391-9be48ecbb360	SUCCESS	Successful	2026-06-21 02:01:07.198	2026-06-21 02:01:25.835	\N	0b02af56-aec1-4185-9391-9be48ecbb360	573c87c3-aa1a-4ba4-9458-96bf52ec4da2	NGN	DEPOSIT	{"metadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 450, "totalCharged": 10450, "campaignTitle": "God is able", "donationAmount": 10000}, "paystack": {"data": {"id": 6282797723, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 4, "type": "action", "message": "Attempted to pay with card"}, {"time": 7, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782007270, "time_spent": 7}, "fees": 25675, "plan": null, "split": {}, "amount": 1045000, "domain": "test", "paidAt": "2026-06-21T02:01:15.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-21T02:01:15.000Z", "currency": "NGN", "customer": {"id": 377157305, "email": "bolutifegboola@gmail.com", "phone": null, "metadata": null, "last_name": null, "first_name": null, "risk_action": "default", "customer_code": "CUS_66fwncj2686j5ya", "international_format_phone": null}, "metadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 450, "totalCharged": 10450, "campaignTitle": "God is able", "donationAmount": 10000}, "order_id": null, "createdAt": "2026-06-21T02:01:07.000Z", "reference": "torchlife-1782007264743-824db44b3ae7", "created_at": "2026-06-21T02:01:07.000Z", "fees_split": null, "ip_address": "212.8.243.116", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_iEsYAOZHPpz8twlH712D", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_tcsmzh6y6r", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 1045000, "transaction_date": "2026-06-21T02:01:07.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}, "status": true, "message": "Verification successful"}, "initialization": {"accessCode": "6zh65sg0ml2qbcx", "authorizationUrl": "https://checkout.paystack.com/6zh65sg0ml2qbcx"}, "verifiedMetadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 450, "totalCharged": 10450, "campaignTitle": "God is able", "donationAmount": 10000}}	\N	paystack	bolutifegboola@gmail.com	card	6282797723	2026-06-21 02:01:25.83
26844e98-5f77-42b6-8012-25a01fa5034f	105000	2026-06-21 13:53:13.868	torchlife-1782049969270-953373304f80	632bfd35-464b-4ef6-bb8e-c8a4f6b7f471	SUCCESS	Successful	2026-06-21 13:52:52.851	2026-06-21 13:53:13.876	\N	632bfd35-464b-4ef6-bb8e-c8a4f6b7f471	573c87c3-aa1a-4ba4-9458-96bf52ec4da2	NGN	DEPOSIT	{"metadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "anonymous": true, "tipAmount": 5000, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 2700, "totalCharged": 105000, "campaignTitle": "God is able", "donationAmount": 100000, "netDonationAmount": 97300}, "paystack": {"data": {"id": 6284616587, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 8, "type": "action", "message": "Attempted to pay with card"}, {"time": 9, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782049980, "time_spent": 9}, "fees": 167500, "plan": null, "split": {}, "amount": 10500000, "domain": "test", "paidAt": "2026-06-21T13:53:09.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-21T13:53:09.000Z", "currency": "NGN", "customer": {"id": 377157305, "email": "bolutifegboola@gmail.com", "phone": null, "metadata": null, "last_name": null, "first_name": null, "risk_action": "default", "customer_code": "CUS_66fwncj2686j5ya", "international_format_phone": null}, "metadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": true, "tipAmount": 5000, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 2700, "totalCharged": 105000, "campaignTitle": "God is able", "donationAmount": 100000, "netDonationAmount": 97300}, "order_id": null, "createdAt": "2026-06-21T13:52:52.000Z", "reference": "torchlife-1782049969270-953373304f80", "created_at": "2026-06-21T13:52:52.000Z", "fees_split": null, "ip_address": "212.8.243.116", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_iEsYAOZHPpz8twlH712D", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_of8r8mm1k1", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 10500000, "transaction_date": "2026-06-21T13:52:52.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}, "status": true, "message": "Verification successful"}, "initialization": {"accessCode": "70nsdh62fvu7gx8", "authorizationUrl": "https://checkout.paystack.com/70nsdh62fvu7gx8"}, "verifiedMetadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": true, "tipAmount": 5000, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 2700, "totalCharged": 105000, "campaignTitle": "God is able", "donationAmount": 100000, "netDonationAmount": 97300}}	\N	paystack	bolutifegboola@gmail.com	card	6284616587	2026-06-21 13:53:13.868
aeb9307f-373a-4077-afaa-aee044c39524	50000	2026-06-21 14:35:47.098	torchlife-1782052530956-9d28c59023d2	c76379c4-843c-4b62-839a-be04c2bc98b0	SUCCESS	Successful	2026-06-21 14:35:32.823	2026-06-21 14:35:47.103	\N	c76379c4-843c-4b62-839a-be04c2bc98b0	e41d031e-865b-48b7-acf4-af164ef04a62	NGN	DEPOSIT	{"metadata": {"donorId": "e41d031e-865b-48b7-acf4-af164ef04a62", "platform": "TorchLife", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "admin@torchlife.co", "platformFee": 1450, "totalCharged": 50000, "campaignTitle": "God is able", "donationAmount": 50000, "netDonationAmount": 48550}, "paystack": {"data": {"id": 6284715700, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 7, "type": "action", "message": "Attempted to pay with card"}, {"time": 8, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782052536, "time_spent": 8}, "fees": 85000, "plan": null, "split": {}, "amount": 5000000, "domain": "test", "paidAt": "2026-06-21T14:35:43.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-21T14:35:43.000Z", "currency": "NGN", "customer": {"id": 377273409, "email": "admin@torchlife.co", "phone": null, "metadata": null, "last_name": null, "first_name": null, "risk_action": "default", "customer_code": "CUS_vs4ojqz4kkq1rif", "international_format_phone": null}, "metadata": {"donorId": "e41d031e-865b-48b7-acf4-af164ef04a62", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "admin@torchlife.co", "platformFee": 1450, "totalCharged": 50000, "campaignTitle": "God is able", "donationAmount": 50000, "netDonationAmount": 48550}, "order_id": null, "createdAt": "2026-06-21T14:35:32.000Z", "reference": "torchlife-1782052530956-9d28c59023d2", "created_at": "2026-06-21T14:35:32.000Z", "fees_split": null, "ip_address": "212.8.243.116", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_iEsYAOZHPpz8twlH712D", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_rc004d1og7", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 5000000, "transaction_date": "2026-06-21T14:35:32.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}, "status": true, "message": "Verification successful"}, "initialization": {"accessCode": "8vh901xe4ncnf25", "authorizationUrl": "https://checkout.paystack.com/8vh901xe4ncnf25"}, "verifiedMetadata": {"donorId": "e41d031e-865b-48b7-acf4-af164ef04a62", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "admin@torchlife.co", "platformFee": 1450, "totalCharged": 50000, "campaignTitle": "God is able", "donationAmount": 50000, "netDonationAmount": 48550}}	\N	paystack	admin@torchlife.co	card	6284715700	2026-06-21 14:35:47.098
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, score, comment, created_at, updated_at, deleted_at, user_id, campaign_id) FROM stdin;
\.


--
-- Data for Name: supporting_document_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supporting_document_requests (id, user_id, campaign_id, requested_at, reviewed_at, reviewed_by_id, status) FROM stdin;
7c4ac9b8-bf46-4e64-8012-0e967156b800	3e92f791-bd56-49b3-a986-551497f68b0a	b9a14119-4216-4341-9d47-2cf2c936099e	2026-06-21 01:21:17.19	2026-06-21 02:07:30.211	e41d031e-865b-48b7-acf4-af164ef04a62	APPROVED
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, first_name, last_name, password, email, activities, created_at, updated_at, deleted_at, phone_number, isverified, role, "refreshToken", marketing_metadata, last_marketing_sync_at, philanthropic_name, impact_score, emergencies_supported) FROM stdin;
573c87c3-aa1a-4ba4-9458-96bf52ec4da2	Guest	Donor	$2b$10$iG5hPpegYFp5sR4XdWiS6uVd2p88xRFQcOWk.fhCr1QrNFA9AHuTm	bolutifegboola@gmail.com	\N	2026-06-21 02:01:04.717	2026-06-21 13:53:13.921	\N	\N	f	USER	\N	{"auth": {"provider": "guest_donor", "hasPassword": false, "profileComplete": false}, "guestDonor": {"createdFromDonation": true}}	\N	guest-bolutifegboola-mqn545hn	33	1
3e92f791-bd56-49b3-a986-551497f68b0a	Boluwatife	Agboola	$2b$10$n6MhINiwNVqVpkqEiVxvYeS4RrCGIptOmcvMCyHpL1Bnp4LbUKUPy	qopeficenet@web-library.net	\N	2026-06-17 13:50:12.591	2026-06-21 13:57:50.685	\N	+2347069014399	t	USER	\N	{"auth": {"provider": "password", "hasPassword": true}, "profile": {"philanthropicName": "ceeprel"}}	\N	ceeprel	0	0
e41d031e-865b-48b7-acf4-af164ef04a62	Admin	TorchLife	$2b$10$eic8huZELNP8yZw69WD2wOrqBAauq.8xqMVSM/831xETy4VT.CaeC	admin@torchlife.co	\N	2026-06-17 14:53:17.185	2026-06-21 14:37:40.148	\N	\N	t	ADMIN	\N	{"auth": {"provider": "seed", "hasPassword": true}, "profile": {"philanthropicName": "TorchLifeAdmin"}}	\N	TorchLifeAdmin	20	1
f3a0c854-dc17-4f35-85b1-233af3285a50	Boluwatife	Agboola	$2b$10$MQxQUrwjcGEGeMKPLO6tN.CpH9rQwXjk/SykmzfMNzk9aANpXFWci	busalec.legaqug@web-library.net	\N	2026-06-17 13:39:46.963	2026-06-17 13:39:47.045	\N	+2347069014391	f	USER	$2b$10$WJC3yKeU6.yzqVX0gVPVk.njB3eM5kOie9620w1APU1OP8rTJl6Ia	{"auth": {"provider": "password", "hasPassword": true}, "profile": {"philanthropicName": "ceeprel"}}	\N	Boluwatife Agboola-f3a0c8	0	0
46cb1608-ff1a-4d22-9dfd-9441da8927da	Boluwatife	Agboola	$2b$10$gcwr3Y62snDKnPge0NoVweVHudFiinJujRaz/YLHuX2Rjje.e/xm2	lumija.opetoh@web-library.net	\N	2026-06-17 13:46:26.027	2026-06-17 13:48:51.622	\N	+2347069014091	f	USER	\N	{"auth": {"provider": "password", "hasPassword": true}, "profile": {"philanthropicName": "lumija.opetoh@web-library.net"}}	\N	Boluwatife Agboola-46cb16	0	0
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wallets (id, balance, user_id, currency, campaign_id, account_status) FROM stdin;
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhooks (id, event, created_at, updated_at, deleted_at, payment_id, event_type, reference, paystack_event_id) FROM stdin;
d864f622-aece-4dbf-acb1-64165f6ec861	{"data": {"id": 6282797723, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 4, "type": "action", "message": "Attempted to pay with card"}, {"time": 7, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782007270, "time_spent": 7}, "fees": 25675, "plan": null, "split": {}, "amount": 1045000, "domain": "test", "paidAt": "2026-06-21T02:01:15.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-21T02:01:15.000Z", "currency": "NGN", "customer": {"id": 377157305, "email": "bolutifegboola@gmail.com", "phone": null, "metadata": null, "last_name": null, "first_name": null, "risk_action": "default", "customer_code": "CUS_66fwncj2686j5ya", "international_format_phone": null}, "metadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 450, "totalCharged": 10450, "campaignTitle": "God is able", "donationAmount": 10000}, "order_id": null, "createdAt": "2026-06-21T02:01:07.000Z", "reference": "torchlife-1782007264743-824db44b3ae7", "created_at": "2026-06-21T02:01:07.000Z", "fees_split": null, "ip_address": "212.8.243.116", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_iEsYAOZHPpz8twlH712D", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_tcsmzh6y6r", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 1045000, "transaction_date": "2026-06-21T02:01:07.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}, "status": true, "message": "Verification successful"}	2026-06-21 02:01:25.864	2026-06-21 02:01:25.864	\N	8cb76e8d-8ac0-4233-b8db-f41ec26e18e2	verification	torchlife-1782007264743-824db44b3ae7	verification:torchlife-1782007264743-824db44b3ae7:6282797723
ff692ec5-af03-4fa6-946a-27cf19013f6f	{"data": {"id": 6284616587, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 8, "type": "action", "message": "Attempted to pay with card"}, {"time": 9, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782049980, "time_spent": 9}, "fees": 167500, "plan": null, "split": {}, "amount": 10500000, "domain": "test", "paidAt": "2026-06-21T13:53:09.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-21T13:53:09.000Z", "currency": "NGN", "customer": {"id": 377157305, "email": "bolutifegboola@gmail.com", "phone": null, "metadata": null, "last_name": null, "first_name": null, "risk_action": "default", "customer_code": "CUS_66fwncj2686j5ya", "international_format_phone": null}, "metadata": {"donorId": "573c87c3-aa1a-4ba4-9458-96bf52ec4da2", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": true, "tipAmount": 5000, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "bolutifegboola@gmail.com", "platformFee": 2700, "totalCharged": 105000, "campaignTitle": "God is able", "donationAmount": 100000, "netDonationAmount": 97300}, "order_id": null, "createdAt": "2026-06-21T13:52:52.000Z", "reference": "torchlife-1782049969270-953373304f80", "created_at": "2026-06-21T13:52:52.000Z", "fees_split": null, "ip_address": "212.8.243.116", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_iEsYAOZHPpz8twlH712D", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_of8r8mm1k1", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 10500000, "transaction_date": "2026-06-21T13:52:52.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}, "status": true, "message": "Verification successful"}	2026-06-21 13:53:13.924	2026-06-21 13:53:13.924	\N	26844e98-5f77-42b6-8012-25a01fa5034f	verification	torchlife-1782049969270-953373304f80	verification:torchlife-1782049969270-953373304f80:6284616587
c1b61e18-f48b-419a-964a-0680d2d60adb	{"data": {"id": 6284715700, "log": {"input": [], "errors": 0, "mobile": false, "history": [{"time": 7, "type": "action", "message": "Attempted to pay with card"}, {"time": 8, "type": "success", "message": "Successfully paid with card"}], "success": true, "attempts": 1, "start_time": 1782052536, "time_spent": 8}, "fees": 85000, "plan": null, "split": {}, "amount": 5000000, "domain": "test", "paidAt": "2026-06-21T14:35:43.000Z", "source": null, "status": "success", "channel": "card", "connect": null, "message": null, "paid_at": "2026-06-21T14:35:43.000Z", "currency": "NGN", "customer": {"id": 377273409, "email": "admin@torchlife.co", "phone": null, "metadata": null, "last_name": null, "first_name": null, "risk_action": "default", "customer_code": "CUS_vs4ojqz4kkq1rif", "international_format_phone": null}, "metadata": {"donorId": "e41d031e-865b-48b7-acf4-af164ef04a62", "platform": "TorchLife", "referrer": "http://localhost:3000/", "anonymous": false, "tipAmount": 0, "campaignId": "94fc78db-7525-4d19-b6bf-d917c96e055c", "donorEmail": "admin@torchlife.co", "platformFee": 1450, "totalCharged": 50000, "campaignTitle": "God is able", "donationAmount": 50000, "netDonationAmount": 48550}, "order_id": null, "createdAt": "2026-06-21T14:35:32.000Z", "reference": "torchlife-1782052530956-9d28c59023d2", "created_at": "2026-06-21T14:35:32.000Z", "fees_split": null, "ip_address": "212.8.243.116", "subaccount": {}, "plan_object": {}, "authorization": {"bin": "408408", "bank": "TEST BANK", "brand": "visa", "last4": "4081", "channel": "card", "exp_year": "2030", "reusable": true, "card_type": "visa ", "exp_month": "12", "signature": "SIG_iEsYAOZHPpz8twlH712D", "account_name": null, "country_code": "NG", "receiver_bank": null, "authorization_code": "AUTH_rc004d1og7", "receiver_bank_account_number": null}, "response_code": "00", "fees_breakdown": null, "receipt_number": null, "gateway_response": "Successful", "requested_amount": 5000000, "transaction_date": "2026-06-21T14:35:32.000Z", "pos_transaction_data": null, "gateway_response_code": "approved"}, "status": true, "message": "Verification successful"}	2026-06-21 14:35:47.126	2026-06-21 14:35:47.126	\N	aeb9307f-373a-4077-afaa-aee044c39524	verification	torchlife-1782052530956-9d28c59023d2	verification:torchlife-1782052530956-9d28c59023d2:6284715700
\.


--
-- Name: OtpToken_pkId_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OtpToken_pkId_seq"', 11, true);


--
-- Name: Beneficiary Beneficiary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Beneficiary"
    ADD CONSTRAINT "Beneficiary_pkey" PRIMARY KEY (id);


--
-- Name: CampaignDocument CampaignDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampaignDocument"
    ADD CONSTRAINT "CampaignDocument_pkey" PRIMARY KEY (id);


--
-- Name: CampaignUpdate CampaignUpdate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampaignUpdate"
    ADD CONSTRAINT "CampaignUpdate_pkey" PRIMARY KEY (id);


--
-- Name: Campaigns Campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_pkey" PRIMARY KEY (id);


--
-- Name: Consent Consent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Consent"
    ADD CONSTRAINT "Consent_pkey" PRIMARY KEY (id);


--
-- Name: Hospital Hospital_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Hospital"
    ADD CONSTRAINT "Hospital_pkey" PRIMARY KEY (id);


--
-- Name: Submitter Submitter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Submitter"
    ADD CONSTRAINT "Submitter_pkey" PRIMARY KEY (id);


--
-- Name: WalletTransaction WalletTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY (id);


--
-- Name: WithdrawalRequest WithdrawalRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: campaign_extension_audits campaign_extension_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_extension_audits
    ADD CONSTRAINT campaign_extension_audits_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: supporting_document_requests supporting_document_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supporting_document_requests
    ADD CONSTRAINT supporting_document_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: OtpToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OtpToken_token_key" ON public."OtpToken" USING btree (token);


--
-- Name: WalletTransaction_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON public."WalletTransaction" USING btree (reference);


--
-- Name: WalletTransaction_wallet_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "WalletTransaction_wallet_id_idx" ON public."WalletTransaction" USING btree (wallet_id);


--
-- Name: campaign_extension_audits_campaign_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX campaign_extension_audits_campaign_id_created_at_idx ON public.campaign_extension_audits USING btree (campaign_id, created_at);


--
-- Name: campaigns_public_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX campaigns_public_id_key ON public.campaigns USING btree (public_id);


--
-- Name: donations_campaign_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX donations_campaign_id_status_idx ON public.donations USING btree (campaign_id, status);


--
-- Name: donations_user_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX donations_user_id_status_idx ON public.donations USING btree (user_id, status);


--
-- Name: file_uploads_publicId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "file_uploads_publicId_key" ON public.file_uploads USING btree ("publicId");


--
-- Name: payments_donation_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_donation_id_idx ON public.payments USING btree (donation_id);


--
-- Name: payments_provider_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_provider_status_idx ON public.payments USING btree (provider, status);


--
-- Name: payments_tx_ref_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_tx_ref_key ON public.payments USING btree (tx_ref);


--
-- Name: payments_user_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_user_id_status_idx ON public.payments USING btree (user_id, status);


--
-- Name: supporting_document_requests_campaign_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX supporting_document_requests_campaign_id_status_idx ON public.supporting_document_requests USING btree (campaign_id, status);


--
-- Name: supporting_document_requests_user_id_campaign_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX supporting_document_requests_user_id_campaign_id_key ON public.supporting_document_requests USING btree (user_id, campaign_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_philanthropic_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_philanthropic_name_key ON public.users USING btree (philanthropic_name);


--
-- Name: users_phone_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_phone_number_key ON public.users USING btree (phone_number);


--
-- Name: wallets_campaign_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wallets_campaign_id_key ON public.wallets USING btree (campaign_id);


--
-- Name: wallets_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wallets_user_id_key ON public.wallets USING btree (user_id);


--
-- Name: webhooks_payment_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX webhooks_payment_id_key ON public.webhooks USING btree (payment_id);


--
-- Name: webhooks_paystack_event_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX webhooks_paystack_event_id_key ON public.webhooks USING btree (paystack_event_id);


--
-- Name: webhooks_reference_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX webhooks_reference_idx ON public.webhooks USING btree (reference);


--
-- Name: CampaignDocument CampaignDocument_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampaignDocument"
    ADD CONSTRAINT "CampaignDocument_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."Campaigns"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CampaignUpdate CampaignUpdate_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CampaignUpdate"
    ADD CONSTRAINT "CampaignUpdate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."Campaigns"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Campaigns Campaigns_beneficiaryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES public."Beneficiary"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Campaigns Campaigns_consentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES public."Consent"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Campaigns Campaigns_hospitalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public."Hospital"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Campaigns Campaigns_submitterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES public."Submitter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WalletTransaction WalletTransaction_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WalletTransaction WalletTransaction_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_wallet_id_fkey" FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WithdrawalRequest WithdrawalRequest_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WithdrawalRequest"
    ADD CONSTRAINT "WithdrawalRequest_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: campaign_extension_audits campaign_extension_audits_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_extension_audits
    ADD CONSTRAINT campaign_extension_audits_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaign_extension_audits campaign_extension_audits_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_extension_audits
    ADD CONSTRAINT campaign_extension_audits_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: campaigns campaigns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campaigns campaigns_verified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_verified_by_id_fkey FOREIGN KEY (verified_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: donations donations_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: file_uploads file_uploads_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT "file_uploads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: file_uploads file_uploads_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT "file_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ratings ratings_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ratings ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: supporting_document_requests supporting_document_requests_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supporting_document_requests
    ADD CONSTRAINT supporting_document_requests_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: supporting_document_requests supporting_document_requests_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supporting_document_requests
    ADD CONSTRAINT supporting_document_requests_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: supporting_document_requests supporting_document_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supporting_document_requests
    ADD CONSTRAINT supporting_document_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wallets wallets_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: webhooks webhooks_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 8Z9D5fdjnbwdrlL0y0NF3mCXtzvafBxbHXW8YEsFvc5oJNU27DvbEbriUfTkN4n


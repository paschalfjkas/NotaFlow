# NotaFlow

AI-powered SIWES / industrial training report generator for Nigerian university and
polytechnic students. Next.js (App Router) + TypeScript + Tailwind + Supabase + Paystack.

> **Build status:** Phases 1-6 are complete — project scaffold, design system, database
> schema, authentication, the 7-step report wizard with autosave, dark mode, the AI
> generation pipeline (provider abstraction, anti-fabrication prompts, quality-control
> pass, real progress tracking), the full report editor with AI section rewrites,
> version history, screenshot placeholders, real DOCX export, Paystack checkout +
> webhook verification for buying report credits, and an admin dashboard (users,
> reports, transactions, pricing). **Phase 7 is complete** — automated tests, the
> accessibility audit, the security audit, and responsive/mobile polish are all done;
> see "Automated tests", "Accessibility", "Security", and "Responsive design" below.
> See "Roadmap" for optional follow-ups.

## Tech stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- **UI:** shadcn/ui (Radix UI primitives), lucide-react icons, React Hook Form + Zod
- **Backend:** Next.js Route Handlers / Server Actions
- **Database & Auth:** Supabase (Postgres + Supabase Auth)
- **AI:** provider-agnostic abstraction (OpenAI / Gemini) — see `src/lib/ai` (Phase 3)
- **Documents:** `docx` (Node.js) for Word export (Phase 4)
- **Payments:** Paystack (Phase 5)

## Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project (Postgres + Auth are foundational —
  the app cannot run without real Supabase credentials, unlike the AI/Paystack
  integrations below which degrade gracefully when unconfigured)

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**

   - Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New project.
   - Once provisioned, open **Project Settings → API** and copy:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose client-side)

3. **Apply the database schema**

   Open the Supabase dashboard → **SQL Editor**, and run the migrations in order:

   ```text
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_credits_rpc.sql
   supabase/migrations/0003_generation_stage.sql
   supabase/migrations/0004_section_tables.sql
   ```

   (If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) + Docker
   installed, you can instead run `supabase link` then `supabase db push` to apply
   them, or `supabase start` for a fully local stack.)

   This creates all tables, row-level security policies, and the `profiles` /
   `credits` auto-provisioning trigger that fires when a user signs up (every new
   user gets 1 free report credit automatically).

4. **Enable email auth (and optionally Google)**

   In **Authentication → Providers**, email/password is enabled by default. To add
   Google sign-in, enable the Google provider and add your OAuth client ID/secret,
   then set the redirect URL to `<your-app-url>/auth/callback`.

5. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the Supabase values from step 2. `PAYSTACK_*` keys can be left blank for now
   (payments are Phase 5). For AI report generation, set `AI_PROVIDER` to `openai`,
   `gemini`, or `perplexity` and supply the matching key:

   - **OpenAI:** `OPENAI_API_KEY` from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
     `OPENAI_MODEL` defaults to `gpt-4o-mini`.
   - **Gemini:** `GEMINI_API_KEY` from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
     `GEMINI_MODEL` defaults to `gemini-1.5-pro`. Has a genuinely free tier.
   - **Perplexity:** `PERPLEXITY_API_KEY` from [perplexity.ai/account/api/keys](https://www.perplexity.ai/account/api/keys)
     (requires a small prepaid credit top-up). `PERPLEXITY_MODEL` defaults to `sonar`,
     its cheapest model. Routed through the `openai` SDK pointed at Perplexity's
     OpenAI-compatible endpoint (`src/lib/ai/providers/perplexity.ts`) — no extra
     dependency needed.

   Without either key, the wizard and review page still work fully, but clicking
   "Generate My Report" will fail with a clear configuration error instead of faking a
   result.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```text
src/
  app/
    (marketing)/        landing page
    (auth)/              login, register, forgot-password
    auth/                Supabase auth callback + reset-password
    dashboard/           authenticated student dashboard (+ reports, settings, billing)
    generate/            7-step report wizard + review (Phase 2)
    report/[reportId]/   generation progress + read-only report viewer (Phase 3)
    admin/               admin dashboard: overview, users, reports, transactions, pricing (Phase 6)
    api/paystack/webhook/ Paystack server-to-server payment notification (Phase 5)
  components/
    ui/                  shadcn/ui primitives + shared UI (EmptyState, etc.)
    marketing/           landing page sections
    dashboard/           dashboard-specific components
    admin/               admin nav, tables, status badges (Phase 6)
    wizard/              step indicator, autosave UI, tag/option multi-selects
    report/              generation wait screen + read-only chapter viewer
    forms/                react-hook-form + zod forms (incl. forms/wizard/*)
  lib/
    supabase/            browser / server / admin / middleware Supabase clients
    credits/             atomic free/paid credit consumption
    payments/            Paystack API wrapper, idempotent fulfillment, formatting (Phase 5)
    validation/          zod schemas (auth + the 7 wizard step schemas)
    ai/                  provider abstraction, prompts, schema, pipeline (Phase 3)
    generation.ts         orchestrates credit consumption + pipeline + persistence
    reports.ts            report fetch/create helpers (ownership-checked)
    env.ts               server env validation
    auth.ts              requireUser() server helper
    admin.ts             requireAdmin() server helper (Phase 6)
  types/database.ts       hand-written Supabase types (see file header to regenerate)
supabase/migrations/      SQL schema + RPC functions, applied in order
```

## Security notes

- All credit consumption goes through the `consume_report_credit` Postgres function,
  which row-locks the user's `credits` row — concurrent requests cannot double-spend
  the same free credit.
- Every table has row-level security enabled; clients can only ever read/write rows
  they own. Privileged writes (crediting paid reports, admin pricing changes) go
  through the service-role client in `src/lib/supabase/admin.ts`, which is imported
  with `server-only` and must never be used in client components.
- `src/middleware.ts` protects `/dashboard`, `/generate`, `/report`, and `/admin`
  routes, and redirects signed-in users away from the auth pages.

## AI generation pipeline (Phase 3)

`src/lib/ai` is provider-agnostic — `getAIProvider()` returns an `OpenAIProvider` or
`GeminiProvider` based on `AI_PROVIDER`, both implementing the same `generateText`
interface, so swapping providers never touches calling code.

Generation (`src/lib/generation.ts`, triggered from the review page's "Generate My
Report" button) runs as one flow:

1. Atomically consumes a credit (free first, then paid) via the same row-locked
   Postgres function from Phase 1 — concurrent clicks can't double-spend.
2. Marks the report `generating` and writes real stage updates (`understanding` →
   `structuring` → `writing_chapters` → `quality_check`) to `generation_stage`, which
   the client polls every 1.5s for an honest progress display (no fake timers).
3. Generates the preliminary pages (cover/certification/dedication/acknowledgement/
   abstract), then all five chapters in parallel, each validated against a Zod schema
   with one retry-with-feedback if the model's JSON doesn't match.
4. Runs a quality-control pass that re-reads the chapters against the student's
   original answers and flags (chapter number + specific problem) anything invented,
   exaggerated, or technically altered; flagged chapters are regenerated once with
   that feedback appended.
5. On success: persists chapters into `report_sections` and marks the report
   `completed`. On failure: refunds the credit and marks it `failed` with the error
   surfaced on the review page, so a failed generation never costs the student their
   report.

The system prompt (`src/lib/ai/prompts/system.ts`) encodes the anti-fabrication rules
from the spec directly: never invent supervisor names, company facts, or statistics;
expand on what the student said rather than inventing new claims; preserve named
technologies exactly; avoid AI-cliché phrasing.

## Report editor & DOCX export (Phase 4)

`/report/[reportId]` is the full editor once a report is `completed`:

- **Edit / Preview toggle** — Edit shows a sidebar (Preliminary Pages + Chapters 1-5)
  with each section individually editable; Preview renders the whole document read-only
  in document-like styling.
- **Per-section AI actions** (`src/lib/ai/prompts/section-edit.ts`) — Regenerate (rebuilds
  the section fresh from the original wizard answers), or rewrite the existing text:
  Improve writing, Make more natural, Make more academic, Shorten, Expand, Fix grammar.
  Rewrites only ever transform the text already there — they're explicitly instructed not
  to introduce new facts, unlike Regenerate which goes back to the source answers.
- **Version history** — every save, rewrite, or regenerate snapshots the previous content
  into `report_section_versions` first (`src/lib/sections.ts`), with a revert button per
  version in the History dialog.
- **Screenshot placeholders** (`src/lib/screenshots.ts`) — add a placeholder to any
  section, upload a PNG/JPG/GIF/BMP (max 5MB; WebP/AVIF aren't supported by Word's image
  embedding) to replace it, edit the caption, or delete it. Stored in a private Supabase
  Storage bucket created automatically on first use, served only via short-lived signed
  URLs.
- **Real DOCX export** (`src/lib/docx/build-report.ts`, built on the `docx` package) —
  cover page, certification, dedication, acknowledgement, abstract, an auto-updating Word
  Table of Contents field, all five chapters with embedded screenshots (or a dashed-border
  placeholder box for ones not yet uploaded), figure captions, structured tables, and
  References and Appendices sections. Times New Roman 12pt, 1.5 line spacing, page
  numbers. Verified by unzipping a real generated file and inspecting `word/document.xml`
  directly — it's a genuine, valid OOXML document, not a mocked response.
  - **References** (`src/lib/ai/prompts/references.ts`) are AI-drafted, but tightly bounded:
    only one citation per tool/technology the student actually listed in the wizard, never
    for anything else, and the model is told to omit a URL entirely rather than guess one
    it isn't sure of. If the "include references" preference is off or the student listed
    no technologies, it falls back to the same honest manual placeholder as before. Either
    way it's a real, editable `report_sections` row — not text baked into the export.
  - **Appendices** has no equivalent source data to draft from, so it stays the manual
    placeholder — but it's now also a normal editable section rather than fixed docx text.
  - **Tables** — when "include tables" is on, the AI may attach one structured table to a
    section whose content is itself list-like data the student already gave (tasks
    performed, tools used, a project list), built only from that data (never invented
    rows). Rendered as a real Word table on export, and visible/removable per-section in
    the editor (`src/components/report/section-editor.tsx`). Requires migration
    `0004_section_tables.sql` (adds `report_sections.table_data jsonb`).
- The dashboard's "Download" shortcut (`/report/[reportId]/download`) builds the docx on
  demand and redirects to a signed URL, so a student can grab the file without opening
  the editor.

## Payments (Phase 5)

`/dashboard/billing` lists the active `pricing_packages` and lets a student buy report
credits via Paystack:

1. **Checkout** (`src/app/dashboard/billing/actions.ts`) — creates a `pending` row in
   `transactions`, then calls Paystack's Initialize Transaction API server-side
   (`src/lib/payments/paystack.ts`) and redirects the student to the hosted checkout
   page. The secret key never reaches the browser.
2. **Confirmation** happens two independent ways, both converging on the same
   idempotent `fulfillTransaction()` (`src/lib/payments/fulfill.ts`):
   - The **webhook** (`POST /api/paystack/webhook`) — Paystack's server-to-server
     notification, verified by recomputing the HMAC-SHA512 of the raw request body
     with the secret key and comparing it to the `x-paystack-signature` header. This
     is the authoritative path; it fires even if the student closes the tab before
     the redirect back completes.
   - The **browser callback** (`/dashboard/billing/callback`) — a same-second UX
     nicety that independently re-verifies the transaction with Paystack's Verify
     API (never trusts the redirect's query params alone) before showing success.
   - `fulfillTransaction()` flips `transactions.status` from `pending` to `success`
     with a single conditional `UPDATE ... WHERE status = 'pending'`; Postgres
     guarantees only one of the two callers sees a row change, so credits are never
     added twice for the same payment, however the two paths race.
3. Crediting itself goes through the existing `add_paid_credits` Postgres function
   (Phase 1), restricted to the service role.

**Going to production:** add your webhook URL in the Paystack Dashboard → Settings →
API Keys & Webhooks → `https://<your-domain>/api/paystack/webhook`, and switch
`PAYSTACK_SECRET_KEY` / `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to your live keys.

## Admin dashboard (Phase 6)

`/admin` is gated on `profiles.role = 'admin'` two ways: `src/middleware.ts` redirects
non-admins before the page even renders, and every admin page/action re-checks via
`requireAdmin()` (`src/lib/admin.ts`) — the same defense-in-depth pattern as
`requireUser()`, since middleware alone is one mistake away from a route slipping
through ungated. There's no self-serve way to become an admin (by design) — it still
requires possessing `SUPABASE_SERVICE_ROLE_KEY`, the same trust boundary as the
Supabase SQL Editor. Use the CLI helper (`scripts/manage-admin.mjs`), which validates
the account exists before touching it:

```bash
npm run admin -- promote you@example.com
npm run admin -- revoke you@example.com
npm run admin -- list
```

Or, equivalently, a raw `update` in the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

All admin reads/writes go through `createAdminClient()` (service role), since every
RLS policy in the schema is "your own row only" — there's no admin-bypass policy, so
regular user-scoped queries can't see other students' data.

- **Overview** (`/admin`) — total users, total reports, revenue (sum of successful
  transactions), outstanding credits, a reports-by-status breakdown, and the 10 most
  recent transactions.
- **Users** (`/admin/users`) — every student with their role, credit balance, and join
  date; search by name/email; a "Grant credits" action for support cases (adds paid
  credits directly, same `add_paid_credits` function Paystack uses).
- **Reports** (`/admin/reports`) — every report across all students (most recent 200),
  read-only — there's no "view as admin" into another student's editor, since that
  would need a real impersonation/ownership model this phase doesn't build.
- **Transactions** (`/admin/transactions`) — every Paystack transaction (most recent
  200) with reference, student, package, amount, and status.
- **Pricing** (`/admin/pricing`) — create packages, edit name/credits/price/sort order,
  and activate/deactivate (no delete, since `transactions.package_key` references a
  package's `key` — deactivating preserves history instead of breaking a foreign key).
  Changes reflect immediately on `/dashboard/billing` and the landing page.

## Automated tests (Phase 7)

```bash
npm test          # run the suite once
npm run test:watch  # re-run on file change
```

[Vitest](https://vitest.dev) runs in plain Node (`vitest.config.mts`), no jsdom/browser —
everything tested here is server-side logic, not component rendering. Two things make
that work:

- `server-only` throws unconditionally unless the importing bundler sets Next's
  `react-server` export condition, so it's aliased to a no-op module
  (`src/test/empty-module.ts`) for tests — see the comment in `vitest.config.mts`.
- Supabase/Paystack calls are mocked at the module boundary (`vi.mock("@/lib/supabase/admin", ...)`),
  never hitting a real database or API — fast, deterministic, and safe to run anywhere.

83 tests across 12 files, deliberately chosen to cover the logic that's expensive to get
wrong and easy to regress silently:

- **Anti-fabrication prompt assembly** (`src/lib/ai/context.test.ts`,
  `src/lib/ai/prompts/*.test.ts`) — every missing field renders as "Not provided — do
  not invent this", the model is never told it can guess a reference URL, and the
  "include tables" flag actually changes what the model is told.
- **AI output contracts** (`src/lib/ai/schema.test.ts`) — the Zod schemas the AI's JSON
  responses are validated against, including the chapter/table/references shapes.
- **Report-section assembly** (`src/lib/ai/section-rows.test.ts`) — the References/
  Appendices fallback-to-placeholder logic and table_data pass-through, extracted from
  `generation.ts` into a pure function specifically so this was testable without a
  database.
- **Credit atomicity** (`src/lib/credits/index.test.ts`) — `InsufficientCreditsError`
  mapping, and that a refund failure never throws (it's best-effort by design).
- **Payment fulfillment idempotency** (`src/lib/payments/fulfill.test.ts`) — the
  webhook and the browser callback both call `fulfillTransaction()` for the same
  reference; the tests assert credits are added exactly once no matter which one
  "wins" the race, and never on a replay.
- **Webhook signature verification** (`src/lib/payments/paystack.test.ts`) — a forged
  or replayed-against-a-different-body signature is rejected.
- **Form validation** (`src/lib/validation/*.test.ts`) — including the
  strict-vs-lenient wizard schema split that autosave depends on.

Not yet covered: component/UI tests and end-to-end flows (e2e was explicitly left for a
later pass — this round prioritized the highest-risk business logic per the plan).

## Accessibility (Phase 7)

Audited via a static sweep of every component/page plus live keyboard and
accessibility-tree testing in-browser. Fixed:

- **Icon-only controls had no accessible name** — the hamburger menu, the account-menu
  avatar button, the screenshot delete button, the "add custom tag" button, and the
  admin pricing edit button were all announced to screen readers as just "button".
  Added `aria-label` to each (and `aria-hidden="true"` on their decorative icons).
- **Unlabeled form inputs** — the admin users search box and the per-row "grant
  credits" number input had no accessible name beyond a placeholder/column header.
  Added `aria-label` to both.
- **Color-only state** — the report editor's chapter/section switcher looked and
  behaved like tabs but used only background color to show which was active, with no
  role a screen reader could use; it's now `role="tablist"`/`role="tab"` +
  `aria-selected`. The wizard's technology/skill toggle buttons similarly gained
  `aria-pressed`. The dashboard and admin nav links gained `aria-current="page"`.
- **Heading hierarchy skip** — the review page went `h1` straight to `h3` for every
  summary card title (no `h2` anywhere); promoted them to `h2`.
- **No skip-to-content link** — every authenticated layout (dashboard, admin, the
  wizard, the report editor) has a persistent top nav before the actual content. Added
  one skip link in the root layout (`src/app/layout.tsx`, visually hidden until
  focused) targeting `id="main-content"` on each layout's `<main>`. Verified live that
  it's reachable on the very first Tab press and that activating it moves real
  keyboard/screen-reader focus (not just the scroll position) into the content —
  `<main>` needed `tabIndex={-1}` for that, since a fragment link doesn't focus a
  non-interactive element by default.

Not yet covered: a full color-contrast pass (no contrast failures were spotted
informally, but nothing was measured against WCAG ratios), and screen-reader testing
with an actual AT (NVDA/VoiceOver) rather than the accessibility tree alone.

## Security (Phase 7)

Audited via a static code sweep (every Server Action, every `createAdminClient()` call
site, RLS policies, secret handling) plus direct verification of the riskiest paths.
Confirmed sound: RLS scopes every report-related table to `auth.uid()`; no secret key
is ever `NEXT_PUBLIC_`-prefixed or reachable from a Client Component; no
`dangerouslySetInnerHTML`/`eval`/raw SQL exists anywhere; `updateProfileAction` builds
an explicit allowlisted update object, so a student can't set their own `role` to
`admin`; admin pages/actions are gated by `requireAdmin()` independently of the
middleware. Three real issues found and fixed:

- **Screenshot upload wrote to storage before checking ownership** (`src/lib/screenshots.ts`) —
  `uploadScreenshotImage()` uses the **admin client** to write the file (it has to, to
  manage the private bucket), which bypasses RLS entirely; only the follow-up DB row
  update was RLS-protected. A logged-in user who obtained another student's
  reportId/screenshotId could have overwritten their file. Fixed by checking ownership
  with the user-scoped client *before* any storage write — RLS now gates it exactly
  like everything else, with the admin client only reached once ownership is already
  confirmed.
- **AI rewrite/regenerate had no rate limit** (`src/lib/ai/rate-limit.ts`, new) — unlike
  report generation, editing a section doesn't consume a credit (by design — it's a
  free editing feature, not a new report), which meant nothing stopped a scripted loop
  from calling the AI provider unlimited times for free. Added a 20-edits-per-hour cap
  that counts the caller's own `report_section_versions` rows (every rewrite/regenerate
  already creates one) — no new table, and RLS already scopes the count to the
  caller's own rows. Verified live that a normal single rewrite still goes through
  untouched.
- **Billing callback didn't check whose transaction it was confirming**
  (`src/app/dashboard/billing/callback/page.tsx`) — it would run Paystack's Verify API
  and show "payment successful" for *any* valid reference, not just the signed-in
  user's own. Credits always landed on the transaction's real owner either way (not a
  fund-theft risk), but any user who obtained someone else's reference could trigger/
  observe their payment confirmation. Fixed by checking with the user-scoped client
  that the transaction belongs to the caller first — RLS's existing
  `transactions_select_own` policy makes this a one-line check. Verified live both
  ways: the account's own transaction still confirms normally, and a foreign reference
  now shows "We couldn't find this payment on your account" without ever calling
  Paystack.
- **`shadcn` (a dev-only CLI tool) was listed as a production dependency** — moved to
  `devDependencies`; it's never imported by application code, only run via `npx shadcn
  add ...`. This also means `npm audit --omit=dev` now reports zero vulnerabilities in
  what's actually shipped (the remaining `npm audit` findings are all transitive dev
  tooling — `eslint-config-next`/`shadcn`'s own `fast-glob`/`micromatch` chain — not
  reachable from the running app).
- **No security response headers** (`next.config.ts`) — added `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, and `Strict-Transport-Security`. Deliberately
  didn't add a Content-Security-Policy — getting one right without breaking Next's own
  inline bootstrap scripts, Google Fonts, or the Paystack redirect needs real per-page
  testing this pass didn't cover.

## Responsive design (Phase 7)

Audited via a static sweep for missing breakpoints plus live testing at phone (375px)
and tablet (768px) widths across every major flow — marketing, auth, the 7-step
wizard, the review page, the report editor, dashboard, and every admin page — checking
specifically for page-level horizontal overflow (`document.documentElement.scrollWidth
> clientWidth`), not just "does it look OK." Two real bugs found and fixed:

- **Dashboard report cards overlapped at phone width** (`src/components/dashboard/report-card.tsx`) —
  the card was a single non-wrapping flex row (icon+title+status badge on the left,
  Open/Download buttons on the right); when the left block's text wrapped to multiple
  lines on a narrow screen, the vertically-centered button group visually collided
  with the status badge. Fixed by stacking the card vertically below `sm:` (buttons
  move to their own row) instead of squeezing both halves into one row at every width.
- **The admin header overflowed the page right at the `md` (768px) breakpoint**
  (`src/components/admin/admin-nav.tsx`) — the inline desktop nav (5 links) switched
  on at `md:flex`, but logo + 5 nav links + theme toggle + "Back to app" + logout
  don't actually fit in one row until closer to 1024px; at exactly tablet width this
  pushed `scrollWidth` past `clientWidth` (confirmed: 798px of content in a 753px
  viewport). This is exactly the kind of bug that's invisible if you only eyeball
  phone and desktop and skip the boundary itself. Fixed by deferring the inline nav
  (and the mobile pill-row fallback) from `md:`/`md:hidden` to `lg:`/`lg:hidden` —
  the horizontally-scrollable pill row already handles tablet widths fine, it just
  wasn't being given the chance to.

Also tightened, lower severity: the admin pricing dialog's Credits/Price fields
(`src/components/admin/pricing-table.tsx`) rendered as two cramped columns
unconditionally instead of stacking on mobile first; and two table cells (admin users'
email, admin transactions' reference) had no `truncate`/max-width, so a long value
would widen the whole (horizontally-scrollable-by-design) table column further than
necessary.

Confirmed already solid, no changes needed: the landing page, the wizard's grids
(all correctly `sm:`-prefixed), the review page, the report editor's two-column
layout (verified exactly at the `md:` collapse point), and the settings page.

## End-to-end tests (Phase 7)

```bash
npm run test:e2e       # headless run
npm run test:e2e:ui    # Playwright's interactive UI mode
```

Four specs under `e2e/`, run single-worker (`playwright.config.ts`) since they all
share one dedicated test account's credit balance and draft-report rows:

- **`landing.spec.ts`** — the marketing page loads signed-out, nav/pricing links
  work, dark mode toggles.
- **`auth.spec.ts`** — the real signup form submits and shows "Check your inbox"
  (it's never chained into login — see below); the test account can log in and out.
- **`report-flow.spec.ts`** — the critical path end to end: log in → start a report →
  fill all 7 wizard steps → review → **Generate My Report** (a real call to the
  configured AI provider — this test gets an 8-minute timeout) → the editor loads with
  real generated content → **Download .docx** actually downloads a file.
- **`billing.spec.ts`** — buy a credit package → the (mocked, see below) checkout
  redirect → verifies the account's credit total in the database actually increased,
  not just that a success message appeared.

**Why a dedicated test account instead of a fresh signup or Google OAuth:**
`e2e/global-setup.ts` provisions one fixed account directly via the Supabase admin
API (`email_confirm: true`, credits topped up to at least 10 before every run) and
logs in through the real `/login` form. A fresh signup can't proceed past "check your
inbox" without a real inbox to confirm from, and Google OAuth can't be driven by a
script at all — so `auth.spec.ts`'s signup test intentionally stops at the
confirmation screen rather than faking its way past email verification.

**Why the AI call is real but the payment isn't:** generation is the actual product
being tested, so `report-flow.spec.ts` hits the real Gemini API and waits for it (this
is the one genuinely slow, non-free test in the suite). Paystack's hosted checkout is
a third-party page this project doesn't control, so instead `src/lib/payments/paystack.ts`
has a narrow test seam — when `E2E_MOCK_PAYSTACK=true` (set only in
`playwright.config.ts`'s `webServer.env`, never elsewhere), `initializeTransaction()`
skips the redirect to Paystack and `verifyTransaction()` skips the real verify call;
everything on either side of that boundary (creating the pending transaction,
`fulfillTransaction()`'s idempotent crediting, the real `credits` row) still runs for
real, which is what `billing.spec.ts` actually checks.

**Known external constraints, not bugs:**

- **Gemini's free tier caps `gemini-2.5-flash` at 20 requests/day**, shared across
  everything that calls it (manual testing and `report-flow.spec.ts` alike). One run
  of this test uses ~7 of those (preliminary + 5 chapters + QC). If it fails with a
  `RESOURCE_EXHAUSTED` / "quota exceeded" error, that's the daily cap, not a code bug —
  it resets on Google's clock (the error message includes exactly how long is left).
  Running the suite against a paid Gemini tier, or `AI_PROVIDER=openai`/`perplexity`
  with a funded key, removes this ceiling entirely.
- **This project's dev sandbox has occasionally slow/flaky networking to Supabase**
  (seen independent of this suite, in one-off scripts too) — `retries: 1` in
  `playwright.config.ts` absorbs that without masking a real, reproducible failure
  (which fails on the retry too).
- Writing `report-flow.spec.ts` surfaced a real gap it was built to catch: Gemini's
  transient `503 UNAVAILABLE` ("model is currently experiencing high demand") wasn't
  being retried — only 429/rate-limit was. Fixed in `src/lib/ai/index.ts`
  (`isRetryableProviderError` now covers both); this is exactly the kind of bug e2e
  coverage against the real provider is for.

## Roadmap

- **Optional follow-up:** a full WCAG color-contrast pass, and testing with an actual
  screen reader (NVDA/VoiceOver) rather than the accessibility tree alone.

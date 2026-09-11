# Tide Water Sports Booking Portal

Tide is a mobile-first water sports rental MVP for visitors and rental operators on Bulgaria's Black Sea coast. Guests can browse equipment, check availability, choose a departure desk, and make a reservation through a simulated payment flow. Staff use a protected dashboard to view bookings and manage equipment departures and returns.

**Payments are simulated.** The portal does not charge cards or connect to a production payment processor. Prices are configured in BGN according to the MVP specification.

## Target regions

| Region / departure desk | Booking support |
| --- | --- |
| **Sunny Beach** | Selectable departure location for rentals |
| **Nessebar** | Selectable departure location for rentals |
| **Burgas Marina** | Selectable departure location for rentals |

The three desks share the same equipment capacity pool. Selecting a different departure location does not create additional inventory; the database tracks capacity by equipment and time interval.

## Features

- Equipment catalog with hourly rates, quantities, and availability.
- Whole-hour reservations between **09:00 and 18:00**, lasting **1–4 hours**.
- Future bookings up to **365 days ahead**, with booking rules evaluated in **Europe/Sofia**.
- Guest checkout with customer details, departure location, terms acceptance, and a confirmation UUID.
- Database-calculated prices, transaction locks to prevent overbooking, and idempotent checkout retries.
- Availability updates through Supabase Realtime, with a 30-second polling fallback.
- Staff sign-in and the operational flow **Reserved → Active → Completed**.
- Interface and legal content in English, Bulgarian, Romanian, German, Polish, and Ukrainian.
- Terms, liability waiver, and privacy pages.
- WebMCP tools: `configure_rental` stages booking controls; `read_rental_availability` reads availability. Neither submits a payment.

## Technology

| Layer | Implementation |
| --- | --- |
| Application | Next.js 16.2.6 App Router, React 19.2.6, TypeScript |
| Styling | Tailwind CSS 4, Radix/shadcn UI primitives, Lucide icons |
| Validation | Zod API validation and PostgreSQL constraints/functions |
| Database | Supabase PostgreSQL |
| Staff identity | Supabase Auth and a database staff allowlist |
| Live updates | Supabase Realtime Broadcast |
| Worker build | Vinext, Vite, and Cloudflare Wrangler |

The standard Next.js commands and the Sites-compatible Worker commands are separate. Use the Next.js path below for ordinary local development.

## Local setup

### 1. Install prerequisites and clone

You need Git, **Node.js 22.13.0 or newer**, npm, and a Supabase project with access to its SQL Editor and Authentication settings. These steps run the app locally against a hosted Supabase project; they do not start a local database.

```sh
git clone https://github.com/demetko/tide-water-sports.git
cd tide-water-sports
npm ci
```

Use the committed `package-lock.json` through `npm ci` for reproducible dependencies.

### 2. Configure the environment

Copy [.env.example](.env.example) to `.env.local` in the repository root.

**PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux:**

```sh
cp .env.example .env.local
```

Fill in your project's values:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_LEGACY_ANON_JWT
# Optional: required only for the signed mock webhook endpoint.
MOCK_WEBHOOK_SECRET=YOUR_RANDOM_SECRET
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | The project's legacy `anon` JWT key |
| `MOCK_WEBHOOK_SECRET` | Only for webhook testing | HMAC secret for the signed mock webhook |

Use the **legacy anon JWT key** with the current server implementation: it sends that key as both the API key and the default Bearer token. A newer `sb_publishable_...` key is not a drop-in replacement for this code path.

The URL and anon key are intentionally exposed by `/api/config` for public Realtime subscriptions. **Never put a service-role key or another private Supabase secret in `SUPABASE_ANON_KEY`.** Database access is restricted by grants, row-level security, and RPC authorization.

Keep `.env.local` untracked. Restart the development server after changing environment values. No `NEXT_PUBLIC_` variables are required.

### 3. Initialize Supabase

1. Open your Supabase project.
2. Open **SQL Editor** and create a new query.
3. Paste the entire contents of [supabase/schema.sql](supabase/schema.sql).
4. Run the script once and confirm success.

The script creates the tables, constraints, seed equipment, row-level security policies, booking functions, and Realtime trigger in a transaction. It is a **fresh-database setup script**, not an idempotent migration. If this project's schema is already installed, skip this step; do not rerun it over existing tables.

Verify the setup in the SQL Editor:

```sql
select id, type, hourly_rate_bgn, max_quantity
from public.equipment
order by id;

select *
from public.tide_availability(current_date + 1, 10, 2);
```

A fresh database should contain the three equipment rows listed below and return availability for each equipment type.

### 4. Start the app

```sh
npm run dev:next
```

Open **http://localhost:3000**. If that port is occupied:

```sh
npm run dev:next -- --port 3001
```

Guests can book without creating an account. To try checkout, choose an available future slot, enter customer details, accept the terms, and use:

- Card: **4242 4242 4242 4242**
- Expiry: any valid future month/year
- Security code: any three digits

A successful mock checkout creates a `Paid` / `Reserved` booking and displays a confirmation. This writes a real reservation record to the configured database, despite the simulated payment.

### 5. Enable the vendor dashboard

1. In Supabase, open **Authentication → Users**.
2. Create an email/password user and ensure it is confirmed if your project requires email confirmation.
3. Run the following in the SQL Editor, replacing the email with that exact user's email:

```sql
insert into public.staff(user_id)
select id
from auth.users
where email = 'operator@example.com'
on conflict do nothing;
```

If no user matches the email, this inserts no row. You can verify membership in the SQL Editor:

```sql
select u.email, s.user_id
from public.staff s
join auth.users u on u.id = s.user_id
where u.email = 'operator@example.com';
```

Open **http://localhost:3000/vendor** and sign in with that user's credentials. Creating an Auth user alone does not grant vendor access; the staff row is also required.

The app uses an HttpOnly, SameSite=Strict `tide_access` cookie, marked Secure on HTTPS, for up to one hour. Protected API requests validate the user and staff membership. Expired sessions require signing in again. Removing the user's staff row revokes vendor access.

### 6. Check and build

```sh
npm run typecheck
npm run lint
npm run build:next
npx next start
```

`npx next start` serves the completed Next.js production build, normally on port 3000. Stop the development server first if it uses that port.

**Do not use `npm start` to serve the Next.js build:** that script serves the Worker build.

### Alternative: Worker development and build

The repository also supports the Sites-compatible Vinext/Cloudflare runtime:

```sh
npm run dev
```

Ordinary portable development uses port **5173** by default. To build and serve the Worker locally:

```sh
npm run build
npm start
```

Use the local URL printed by Wrangler. This path uses the generated `dist/server/wrangler.json` and requires the Worker build to complete first. These commands do not publish a site.

## Supabase PostgreSQL database

[supabase/schema.sql](supabase/schema.sql) is the authoritative rental database definition. All columns in the following tables are non-nullable, including their primary keys.

### `public.equipment`

Each row represents a rentable equipment category and its total shared fleet quantity.

| Column | PostgreSQL type | Default / constraints | Meaning |
| --- | --- | --- | --- |
| `id` | `serial` | Primary key; sequence-generated | Equipment identifier |
| `type` | `varchar(100)` | Required | Display name of the equipment or experience |
| `hourly_rate_bgn` | `decimal(10,2)` | Must be greater than 0 | Price per unit per hour in BGN |
| `max_quantity` | `integer` | Must be greater than 0 | Shared fleet capacity across all departure desks |

**Initial seed data:**

| Equipment | Hourly rate (BGN) | Capacity |
| --- | ---: | ---: |
| Jet Ski Kawasaki STX-160 | 120.00 | 8 |
| Parasailing Tandem Flight | 90.00 | 3 |
| Sea Ray 230 Yacht Charter | 350.00 | 2 |

The authoritative price is:

```text
total_price_bgn = hourly_rate_bgn × quantity × duration_hours
```

For example, two jet skis for two hours cost **480.00 BGN**. The checkout function reads the current rate from PostgreSQL and rejects a mismatched submitted total.

### `public.bookings`

Each row stores one reservation, its customer details, payment state, and operational state.

| Column | PostgreSQL type | Default / constraints | Meaning |
| --- | --- | --- | --- |
| `id` | `serial` | Primary key; sequence-generated | Internal booking identifier |
| `equipment_id` | `integer` | Foreign key → `equipment.id`; `ON DELETE CASCADE` | Reserved equipment category |
| `customer_name` | `varchar(255)` | Required | Customer's name |
| `customer_phone` | `varchar(50)` | Required | Customer's contact number |
| `booking_date` | `date` | Required | Local rental date |
| `start_time` | `time` | Whole hour; within operating window | Local rental start time |
| `duration_hours` | `integer` | Between 1 and 4 | Reserved duration |
| `total_price_bgn` | `decimal(10,2)` | Greater than 0 | Total price for all units and hours |
| `payment_status` | `varchar(50)` | Default `Pending`; allowed `Pending`, `Paid`, `Refunded` | Payment state |
| `fulfillment_status` | `varchar(50)` | Default `Reserved`; allowed `Reserved`, `Active`, `Completed`, `No-Show`, `Cancelled` | Rental operational state |
| `quantity` | `integer` | Default 1; greater than 0 | Number of units reserved |
| `departure` | `varchar(30)` | Exactly `Sunny Beach`, `Nessebar`, or `Burgas Marina` | Chosen departure desk |
| `confirmation` | `uuid` | Unique; default `gen_random_uuid()` | Customer-facing confirmation reference |
| `idempotency_key` | `uuid` | Unique; supplied by checkout | Prevents duplicate bookings from retries |
| `request_hash` | `text` | Required | Fingerprint of the booking payload for retry consistency |
| `terms_accepted_at` | `timestamptz` | Default `now()` | Recorded terms acceptance time at creation |
| `created_at` | `timestamptz` | Default `now()` | Reservation creation timestamp |

The date and time columns store local schedule values; checkout evaluates the current time in `Europe/Sofia`. Audit timestamps use PostgreSQL's timezone-aware `timestamptz`.

Table checks enforce a start at or after 09:00, an end at or before 18:00, and zero minutes/seconds in the start time. Checkout additionally validates the future slot, 365-day horizon, customer name, phone format, departure, terms acceptance, price, and remaining capacity. Deleting an equipment row cascades to its bookings, so equipment deletion must be treated as a destructive operation.

The partial index **`bookings_horizon`** covers `(booking_date, equipment_id, start_time)` for `Paid` bookings whose fulfillment status is `Reserved` or `Active`.

### Supporting table: `public.staff`

| Column | PostgreSQL type | Constraints | Meaning |
| --- | --- | --- | --- |
| `user_id` | `uuid` | Primary key; foreign key → `auth.users.id`; `ON DELETE CASCADE` | Supabase Auth user authorized for vendor operations |

Credentials remain in Supabase Auth; the staff table stores only membership.

### Access control

Row-level security is enabled on all three tables.

| Resource | Guest (`anon`) | Signed-in user |
| --- | --- | --- |
| Equipment rows | Read | Read |
| Booking rows | No direct access | Read only when allowlisted in `staff` |
| Staff membership | No access | Read own membership only |
| Availability RPC | Execute | Execute |
| Mock checkout RPC | Execute | Execute |
| Rental transition RPC | No access | Execute, with staff membership enforced inside the function |

Neither application role receives direct table write grants. Writes pass through the defined database functions. The intentionally public mock checkout RPC is suitable only for simulated payments.

## Booking logic and Realtime

| Function | Responsibility |
| --- | --- |
| `tide_availability(p_date, p_hour, p_duration)` | Return available quantity for each equipment type over the requested interval |
| `tide_mock_checkout(...)` | Validate the request, lock equipment, verify price/capacity, and create a mock-paid reservation atomically |
| `tide_transition(p_id, p_status)` | Authorize staff and enforce allowed rental state changes |
| `tide_broadcast()` | Broadcast availability invalidation after a booking insert or update |

Availability subtracts the **maximum concurrent hourly usage** during the requested interval from equipment capacity. Only `Paid` bookings in `Reserved` or `Active` count. Adjacent bookings do not overlap: a booking ending at 11:00 does not consume the 11:00–12:00 slot.

Checkout takes an equipment-row lock so competing bookings cannot both claim the same final units. An advisory transaction lock serializes requests sharing an idempotency key. An identical retry returns the existing confirmation; reusing the key for a different payload produces `IDEMPOTENCY_CONFLICT`. The stored MD5 request hash is a consistency fingerprint, not encryption.

The mock checkout inserts `Pending` and updates to `Paid` in the same transaction. Staff can activate a paid reservation on its booking date at or after its scheduled start, then mark an active rental completed. Completion removes it from capacity calculations. The UI does not implement cancellation, no-show marking, or refunds, even though the schema can represent those states. Late returns require operator oversight because capacity is allocated only within the scheduled interval.

The `tide_booking_changed` trigger emits event **`availability`** on public channel **`tide-availability`**. Its application payload contains only `date` and `equipment_id`; it does not broadcast customer details. Clients refetch authoritative availability when notified, and poll every 30 seconds as a fallback.

## Pages and API

| Route | Purpose / access |
| --- | --- |
| `/` | Public catalog and booking flow |
| `/vendor` | Staff login and operations dashboard |
| `/compliance/terms` | Localized terms and waiver |
| `/compliance/privacy` | Localized privacy information |
| `GET /api/config` | Public Supabase client configuration |
| `GET /api/equipment` | Public equipment catalog |
| `GET /api/availability?date=YYYY-MM-DD&hour=10&duration=2` | Public aggregate availability |
| `POST /api/payments/mock` | Simulated checkout |
| `POST /api/payments/webhook` | Signed mock payment event |
| `GET /api/staff` | Check staff session |
| `POST /api/staff` | Sign in |
| `DELETE /api/staff` | Sign out |
| `GET /api/bookings?date=YYYY-MM-DD` | Staff-only booking list |
| `PATCH /api/bookings` | Staff-only transition with `{ "id": 1, "status": "Active" }` or `"Completed"` |

## Mock payment integration

The browser validates the sample card locally and sends only `payment_token: "pm_mock_visa"` with the booking request. Card numbers and security codes are not transmitted or stored.

The optional webhook accepts a Stripe-shaped **test** event with:

- `type: "payment_intent.succeeded"`
- `livemode: false`
- `data.object.currency: "bgn"`
- `data.object.amount_received` equal to the booking total in minor units
- `data.object.metadata.booking` containing the same validated booking object as the mock API

Set `MOCK_WEBHOOK_SECRET` and sign the exact raw request body with HMAC-SHA256. The `stripe-signature` header has the form `t=<unix-seconds>,v1=<hex-signature>`, where the signed text is `<timestamp>.<raw-body>`. The endpoint checks the five-minute timestamp tolerance, signature, test mode, currency, amount, and booking input. Retries share the booking idempotency key.

This endpoint is a simulation helper, not a production Stripe integration. Before accepting real payments, replace the public mock checkout path and revoke its public RPC execute grant; payment confirmation must come from a verified payment provider.

## Project layout

```text
app/
  page.tsx                 Public booking interface
  vendor/page.tsx          Staff dashboard
  api/                     Server API routes
  compliance/              Terms and privacy pages
components/
  site-shell.tsx           Shared navigation and layout
  legal.tsx                Localized legal content
  ui/                      Reusable UI components
lib/
  server.ts                Supabase requests, auth, checkout validation
  client.ts                Client helpers
  i18n.tsx                 Localization
supabase/
  schema.sql               Authoritative rental database setup
scripts/                   Next/Vinext/Worker runtime utilities
.env.example               Environment variable template
next.config.ts             Next.js configuration
vite.config.ts             Worker build configuration
```

The starter `db/` and `drizzle/` files are separate from the rental database. `npm run db:generate` does **not** initialize Supabase; use `supabase/schema.sql`.

## Verification and troubleshooting

Run `npm run typecheck` and the build command for your chosen runtime after code changes. There is no `npm test` script or committed automated booking test suite.

For a manual smoke test using nonproduction data:

1. Confirm all three seeded equipment types appear.
2. Change date, duration, quantity, and departure, and check price and availability.
3. Complete a mock reservation and verify its confirmation and reduced capacity.
4. Check that a guest cannot access `/api/bookings`.
5. Sign in as an allowlisted staff user and verify the booking appears.
6. For a reservation eligible to start now, move it to Active and then Completed.
7. Switch languages and inspect the booking, terms, and privacy pages.

| Symptom | Check |
| --- | --- |
| `NOT_CONFIGURED` | Fill both Supabase variables in `.env.local` and restart. The webhook additionally needs its secret. |
| Authentication / invalid JWT error | Confirm the URL and legacy anon JWT belong to the same project. |
| Tables or RPCs missing | Run the complete schema on a fresh project; verify you configured that project's URL. |
| Staff receives `FORBIDDEN` | Confirm the Auth user's UUID appears in `public.staff`. |
| `PAST_SLOT` | Choose a future start evaluated in Europe/Sofia. |
| `PRICE_CHANGED` | Refresh prices and submit the current database-calculated total. |
| `SOLD_OUT` | Refresh availability and reduce quantity or choose another interval. |
| `INVALID_TRANSITION` | Check payment status, current rental state, booking date, and start time. |
| `npm start` cannot find Worker output | Run `npm run build` first, or use `npx next start` after `npm run build:next`. |
| Checkout fails inside the Realtime trigger | Compare the installed `tide_broadcast` function with the schema's four-argument `realtime.send` call. |

The correct broadcast call uses a JSONB payload, an event name, a topic, and the private-channel flag:

```sql
perform realtime.send(
  jsonb_build_object('date', new.booking_date, 'equipment_id', new.equipment_id),
  'availability',
  'tide-availability',
  false
);
```

This is a statement inside the trigger function, not a standalone SQL Editor repair script.

## MVP scope and launch preparation

The app includes simulated payments, staff-managed departures/returns, and legal text templates. It does not implement production card processing, automatic weather monitoring, real refunds, accounting invoices, an inventory administration UI, or customer self-service cancellation.

Before taking real bookings, the operator must provision staff, integrate real payment verification, and review business identity, privacy contacts, retention periods, currency presentation, licenses, insurance, and the supplied legal text. The templates are not a certification of legal compliance.

## Photo credits

Illustrative photos are by [Adam Azim](https://unsplash.com/photos/birds-eye-view-of-personal-watercraft-gOOXG-fxx9k) (jet ski), [Ishan](https://unsplash.com/photos/aerial-photo-of-parachute-above-sea-EkXPFoV7vF4) (parasailing), and [iSAW Company](https://unsplash.com/photos/a-large-white-boat-in-the-middle-of-the-ocean-bucJYv-xlsY) (yacht), via Unsplash. They are not claimed to depict the exact inventory models.

# Tide — Water Sports Rental MVP

A mobile-first booking app for Sunny Beach, Nessebar and Burgas Marina. Built with Next.js App Router, TypeScript, Tailwind and Supabase PostgreSQL/Auth/Realtime. Sites uses the compatible Vinext build for its Cloudflare Worker runtime; ordinary Next.js development and production builds are also available.

## Run

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and supply the Supabase URL and public anon/publishable key.
3. Run `supabase/schema.sql` once in the Supabase SQL editor.
4. Run `npm run dev:next`. `npm run build:next` builds with Next.js; `npm run build` builds the Sites Worker.

## Staff access

Create a user in Supabase **Authentication → Users**, then authorize that exact user:

```sql
insert into public.staff(user_id)
select id from auth.users where email = 'your-staff-email@example.com'
on conflict do nothing;
```

Open `/vendor` and sign in using that user's email and password. Passwords are checked by Supabase Auth. The app stores only the access token in an HttpOnly, SameSite=Strict cookie (Secure on HTTPS) for up to one hour. Every booking read and state change is checked server-side and against database staff membership. Expired sessions require sign-in again. Removing the staff row revokes staff access.

## Booking and capacity

- Exact seed: Kawasaki STX-160 (120 BGN/hour, 8), tandem parasailing (90 BGN/hour, 3), Sea Ray 230 (350 BGN/hour, 2).
- The three departure desks share a fleet capacity pool.
- Slots start on whole hours, 09:00–18:00 in Europe/Sofia, with 1–4 hour durations and a 365-day booking horizon.
- Prices are recomputed from PostgreSQL rates. An equipment-row lock protects overlapping bookings. Idempotency keys and a transaction advisory lock prevent duplicate reservations on concurrent retries.
- Capacity is allocated across the booked interval. A completed return releases remaining allocated time. Operators must monitor late returns; the MVP does not automatically extend overdue time slots.
- Public visitors can read equipment and aggregate availability, but cannot read booking records or staff membership.
- Database broadcasts include only date and equipment ID. Clients refetch authoritative state on broadcasts and every 30 seconds as a fallback.
- All interface strings and legal content support en, bg, ro, de, pl and uk. Device storage is used only for language preference.

## Mock payments

This is an intentionally mock-only payment flow. No real payment processor is connected.
Use card **4242 4242 4242 4242**, a future expiry, and any three-digit security code. Card fields are never transmitted or persisted. The API receives only a mock token.

`POST /api/payments/mock` validates input and invokes the atomic PostgreSQL mock checkout. It inserts Pending and transitions to Paid inside the same transaction. This public mock RPC must be replaced and its public execute grant revoked before accepting real payments.

`POST /api/payments/webhook` accepts a Stripe-shaped TEST event with `livemode: false`, `type: "payment_intent.succeeded"`, currency `bgn`, and `data.object.amount_received` in minor units. `data.object.metadata.booking` must contain the same validated booking object as the mock checkout API. Set `MOCK_WEBHOOK_SECRET` and sign the exact raw body with HMAC-SHA256, using header `stripe-signature: t=<unix-seconds>,v1=<hex-HMAC-of-timestamp-dot-body>`. Signatures older than five minutes, wrong amounts/currency and live events are rejected. Replays use the same booking idempotency key.

## Before a real launch

The published build is an MVP with simulated payments. Staff users must be provisioned and allowlisted. The rental operator must review legal identity, privacy contacts, retention periods, licenses, insurance, currency presentation and the supplied legal text. Pricing remains in BGN as requested by the specification. No automatic weather monitoring, real refunds, accounting invoices or production Stripe processing is represented as implemented.

## Verification

`npm run typecheck` checks TypeScript. Build checks cover all routes. API verification checks fleet seed, aggregate capacity, guest access denial, amount tampering, mock checkout idempotency, overbooking rejection and signed webhook validation. Full staff action verification requires a provisioned staff account.

WebMCP exposes `configure_rental` (stages only; never pays) and `read_rental_availability`. Both validate inputs and share the visible app state.

Photos: Adam Azim (jet ski), Ishan (parasailing), iSAW Company (yacht), via Unsplash. Images are illustrative and are not claimed to depict the exact inventory models.

References: [Supabase database broadcast](https://supabase.com/docs/guides/realtime/broadcast), [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/).

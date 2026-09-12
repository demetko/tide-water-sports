# Changelog

This file records changes to the Tide Water Sports Booking Portal. Entries describe shipped behavior; package version numbers are not used as release labels.

## 2026-09-12 — Euro pricing, streamlined filters, and departure maps

Feature implementation: [06a0145](https://github.com/demetko/tide-water-sports/commit/06a01451595d0fb8f8650405f5b9ea2b5fc8ad41).

### Currency and checkout

- Switched application monetary fields to `equipment.hourly_rate_eur` and `bookings.total_price_eur` across the catalog, booking API, checkout, vendor dashboard, and SQL functions.
- Set the seeded hourly rates to €60 for Jet Ski Adventure / Kawasaki STX-160, €45 for Parasailing Tandem Flight, and €175 for Sea Ray 230 Yacht Charter.
- Added shared euro formatting and rental arithmetic in [lib/money.ts](lib/money.ts). All six supported locales use the € symbol while retaining localized number formatting. Totals are calculated using integer cents.
- Updated all localized currency labels and legal pricing text, including the booking summary, payment button, confirmation, and staff revenue display.
- Required `currency: "EUR"` in booking API payloads. Signed mock payment events require `data.object.currency: "eur"`; received amounts remain expressed in cents.
- Normalized numeric amounts with PostgreSQL `trim_scale` before generating checkout retry fingerprints, so numerically equal totals such as `240` and `240.00` return the same reservation when the idempotency key and other fields match.
- Retained authoritative database pricing, equipment-row locking, capacity checks, and conflicting-retry rejection. Payments remain simulated.

### Layout

- Removed the shield-and-slogan module containing “Local operators. Unforgettable experiences.” and its unused translations and styles.
- Rebalanced the departure/date filter into two equal desktop columns with additional horizontal spacing. On small screens, the controls stack vertically.
- Preserved the adventure cards, booking panel, safety information, and vendor workflow.

### Interactive departure map

- Added [components/departure-map.tsx](components/departure-map.tsx), backed by Leaflet 1.9.4 and free OpenStreetMap standard tiles.
- Placed the map directly below the adventure selection grid and connected its camera to the departure dropdown.
- Set each selected hub to zoom 14: Sunny Beach `[42.6931, 27.7088]`, Nessebar `[42.6587, 27.7348]`, and Burgas Marina `[42.4925, 27.4831]`.
- Added the five specified illustrative kiosk pins in [lib/locations.ts](lib/locations.ts), with numbered activity-colored markers, accessible names, and high-contrast popups.
- Added side-by-side Google Maps and Apple Maps directions links using each kiosk's coordinates. Google uses the valid `/maps/dir/?api=1&destination=...` route; Apple uses the native `maps://?q=...` scheme.
- Added responsive sizing, keyboard interaction, touch zoom, reduced-motion handling, visible attribution, and localized loading/error/retry states.
- Prevented map zoom controls from covering popup headings on mobile. No visitor GPS collection or per-kiosk inventory allocation was added.

### Database migration and compatibility

- Added [supabase/migrations/20260912_euro_pricing.sql](supabase/migrations/20260912_euro_pricing.sql) for existing installations; [supabase/schema.sql](supabase/schema.sql) now creates fresh databases with euro fields and rates.
- The migration converts predecessor simulated amounts once by dividing by two, renames monetary check constraints, and refreshes stored retry fingerprints. Existing booking identifiers, confirmation keys, customer details, schedules, and capacity are retained.
- Repaired `tide_broadcast()` to call `realtime.send` with a JSONB payload, event `availability`, topic `tide-availability`, and `false` for the private-channel flag. The migration installs this repair before updating records so the trigger cannot interrupt conversion.
- The connected Supabase installation was migrated, and the corrected trigger was saved. Other installations must run the migration before switching to this app revision.
- This changes column names and the booking payload contract. External test clients and previously opened app tabs must update to the euro revision together. See the [upgrade instructions](README.md#updating-an-existing-installation).

### Verification completed for the feature update

- TypeScript check and Vinext/Worker production build passed.
- The connected equipment API returned the authoritative rates 60, 45, and 175.
- Shared calculations returned €240 for two jet skis for two hours, €270 for two parasailing units for three hours, and €1,400 for two yachts for four hours.
- Euro-symbol formatting was checked for English, Bulgarian, Romanian, German, Polish, and Ukrainian.
- API checks rejected missing/unsupported currencies and mismatched prices, and denied guest access to booking records.
- A database test verified successful €240 mock checkout, decimal-safe retries, capacity allocation, price tampering rejection, overbooking rejection, and conflicting retry rejection. Its reservation was rolled back.
- Desktop and 390-pixel mobile checks covered map rendering, region changes, popup contrast, destination links, keyboard interaction, and page width. The checked preview reported no browser console errors.

These describe checks performed during the update, not a committed automated test suite. Full staff-operation verification still requires a provisioned staff account. Apple link activation depends on the device's registered Maps handler.

## 2026-09-12 — Documentation follow-up

- Expanded the README with a release summary, upgrade steps, all five kiosk coordinates, map interaction details, new source modules, and additional manual checks.
- Added this changelog to distinguish completed features, compatibility changes, and verification results.
- Corrected the dollar-quote delimiters around the broadcast function in the checked-in migration. This fixes the downloadable migration's SQL syntax; the already-installed Supabase function used the correct delimiters.

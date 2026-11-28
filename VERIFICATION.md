# Cross World Travel · Engineering verification

## Demo-to-live screen review

| Demo screens | Live implementation |
| --- | --- |
| Splash, onboarding, sign-in and signup | The branded launch hands off to the original three slides. Skip opens Explore. The last slide opens account creation or sign-in. The original account layout presents the live form and uses the travel desk’s invite code for account verification. Apple and Google controls are visible and disabled during invite-only testing. |
| Explore, search, destination and service launcher | These use the original components with guest navigation enabled. Notifications open the traveller’s actual request list for agency updates. |
| Flights, hotels, holidays, Umrah and Hajj, visas and Egypt approval | The service catalogue uses the original screens. Live flight results come from published routes and use the real multi-city and filter forms. Hotel requests include room counts. Egypt approval uses the agency eligibility list and requires a flight ticket. |
| Trips, request detail and support | Trips use the original upcoming and past layout with date-filtered requests. The detail screen shows the real quote and booking state. Support uses the original chat layout, with private request selection, live messages, history, quick replies and the actual request status. Call and WhatsApp use the agency contact details. |
| Profile, saved places and legal pages | The shared profile and saved screens use the actual account and preferences. The policy pages describe the live collection and account deletion. |
| Prototype-only details | The demo’s simulated fares, seat maps, checkout, payment methods, issued tickets, staff presence, document vault and voice recording do not have a live provider or workflow configured. |

20 November 2026 · Android, iOS and browser client · private repository checkout

## Service updates verified on 23 November 2026

The computer preview and the local-network phone demo were tested at a 390 × 844 viewport. The root launch showed the bundled brand intro and opened Explore. Guest service search found all six categories. A three-leg flight search returned one result group per leg, and a filter change issued a new request. The demo's direct-flight filter reduced four sample London–Cairo outbound options to three. Hotel search accepted two rooms for two guests. The international phone selector accepted a Ugandan national-format number on a real enquiry and a Canadian number in demo signup. An existing GBP preference can be changed to USD and used for new quotes. Actual agency quotes display the currency issued.

All 21 backend tests passed on a disposable PostgreSQL instance. SQLite passed 19 with two PostgreSQL concurrency cases skipped. The tests covered country-list changes, rejection without a ticket, file validation, idempotent application submission, private records, filtering published flights, ordered multi-city legs, rooms and quote currency. Test-only flights and eligible countries were confined to the test database. A mobile browser completed registration, sign-in, messaging and account deletion against the working API. TypeScript, the release build, standalone demo build, Android and iOS asset sync, migration consistency and Python lint were checked. Signed builds and physical-device testing remain pending.

Egypt security approval stays closed until the agency enters its passport-country list. A staff member must review the submitted ticket before applying. The flight search reads published agency schedules. Live supplier inventory is a separate integration.

## Delivery scope

Travellers can browse the existing bilingual itinerary collection, open a request for flights, hotels, holidays, visas, Umrah or Egypt tours, and correspond privately with the agency. Each request has a traveller, destination, service, departure date and party size. Desk operators can ask for a photo, issue a dated quote, and enter a real supplier reference and itinerary after the traveller accepts. The quote total is stored as an exact decimal with a currency. Quote revisions have distinct identifiers. A confirmation exists only after staff records one.

The earlier simulated payment, seeded passenger, boarding passes and scripted chatbot remain in the development showcase. The normal client uses the API for account and trip data. No airline inventory, payment gateway, automated ticketing, automated visa submission or external chat provider has been connected. These require supplier accounts and approved integration contracts. The selected first release is an agency-assisted booking service.

## Design verification on 21 November 2026

The released interface shares the prototype’s home, service screens, destination cards, profile, support header and globe navigation. At a 390 × 844 viewport, the live home heading, tile grid, first destination card and dock matched the position and dimensions in the original demo. All six service labels fit at 320, 390 and 430 pixels. At desktop width, both presentation panels and the phone frame were present. A browser check opened all six services and used the desktop shortcut to open Cairo & Giza. Another completed registration, sign-in, a travel request, messaging and deletion against the local API, and verified Arabic layout.

The Android and iOS projects synchronized using a test server address. Physical-device results and signed builds are pending. The restored local release passed TypeScript checking and all 16 applicable SQLite tests. Two PostgreSQL-specific tests were skipped on SQLite.

## Recorded checks

| Check on 20 November 2026 | Result |
| --- | --- |
| PostgreSQL 18.7, isolated loopback database | All 18 tests passed, including simultaneous duplicate submissions and shared throttle updates. |
| Local SQLite | 16 passed. The two PostgreSQL concurrency tests were skipped by design. |
| Browser | Chromium-based Edge at 390 × 844 passed the end-to-end account and travel-request flow, including Arabic right-to-left navigation and deletion. The adjacent phone preview is the captured browser interface. |
| Build and schema | TypeScript, Vite production build, frozen dependency installation, backend lint and migration-drift checks passed. The Android and iOS Capacitor asset and project syncs both passed with a reserved test origin. |
| Known vulnerabilities | The initial JavaScript audit reported seven advisories. The updated lockfile reports zero. The pinned Python dependency audit reported zero known vulnerabilities. |
| Secret detection | Gitleaks 8.30.1 scanned both commits reachable from all fetched refs after unshallowing. It reported zero findings. No credentials were identified for rotation. |
| Production settings check | Django reported two HSTS policy warnings covering all subdomains and preload. Host-level HSTS is enabled. The broader options remain off pending domain-owner review. |
| Device and scale | Physical device QA, signed binaries, SMTP delivery to an external mailbox, production TLS/ingress, an independent security assessment, and sustained load/restore testing remain open. |

## Controls and evidence

| Area | Implemented | Verification |
| --- | --- | --- |
| Account ownership | Mailbox verification before a password can be set. Argon2id password hashing and Django password validation. | Create account, reject weak password, confirm hash format, single use and expiry. |
| Recovery and sessions | Thirty-minute email links are stored as digests. Eight-hour browser and device sessions. Cookies are HttpOnly, Secure in production and SameSite=Lax. Native bearer tokens are held in memory, stored as hashes on the server and revoked on logout/reset. | Login and logout for each channel, reset and session revocation, email worker retry. |
| Cross-origin and transport | Standard browser CSRF middleware. Native endpoints reject cookies, check the origin and accept an explicit bearer header. Production requires HTTPS, host validation and verified database TLS. Responses set HSTS, CSP, frame and content-type protections as applicable. | Browser request with missing CSRF token, native preflight and disallowed origin, cookie rejection, redirect and HSTS response. |
| Rate limits | Database counters shared across workers. Fixed windows bound API traffic, login attempts by IP and account, recovery, uploads, messages and new requests. Throttle keys are HMAC digests. | Login budget is shared between browser and device. Concurrent database calls verify counter atomicity. |
| Private records | Access queries include the signed-in owner. Exact field allowlists reject client-supplied prices, owner IDs or staff status. Django ORM binds query values. React renders traveller and staff strings as text. | Separate-account and signed-out tests cover list, detail, messages, attachments, history and quote acceptance. |
| Prices and retries | Unique account/request key prevents duplicate enquiries after retry. Quote acceptance checks the latest quote ID and its expiry within a transaction. | Concurrent submissions, repeat acceptance, price-field rejection and expired/replaced quotes. |
| Staff authority | Normal registration creates a traveller. The Travel desk group has limited model permissions. Staff issue immutable quotes and confirmations through the admin, and need a separate permission to download an attachment. | Sign-in gate, staff without model permissions, permitted operator issues a quote, traveller accepts it, operator records a supplier confirmation. |
| Attachments | A staff request must exist first. One JPEG or PNG under 2 MiB, up to 12 megapixels. Server decodes and re-encodes, removes metadata and the original filename, and stores the result privately. | Missing authorisation, invalid bytes, over-limit file, valid image and removal of EXIF. |
| Erasure | Password reconfirmation removes the account, requests, quotes, confirmations, messages, photos, native tokens, pending email jobs/links and associated staff action records. Expired security records are pruned by the worker. | Wrong password, successful deletion, private records disappear, other traveller unaffected. Public deletion entry reached through the browser. |

## Data and store handoff

The app includes English and Arabic privacy and terms screens and an in-app account-deletion flow. The server also serves a standalone deletion entry at `/delete-account`. The agency must publish the final public links, verify the legal contact, identify its actual hosting and email providers, set backup retention and reconcile the store forms with production data handling. In particular, deletion from the active database does not erase an email already delivered or every historical backup. The app collects no card details, device location, ad identifiers or analytics events in its traveller interface. Provider logs and backup policies must be checked separately.

Apple’s account-deletion guidance and Google Play’s account-deletion guidance were checked on 20 November 2026. The release owner should complete the store disclosures for the actual signed build. [Apple Developer](https://developer.apple.com/support/offering-account-deletion-in-your-app/) · [Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/13327111)

## Release work

1. Set the real HTTPS staging origin, trusted ingress, verified PostgreSQL connection and agency SMTP sender. Run migrations and the worker, then verify mail arrives on a separate device. Test backups and recovery and confirm log retention. Apply staff MFA at the identity-aware ingress before handling customer travel documents. Staff MFA is an operational item in this handoff.
2. Confirm the provisional application identifier, agency contact and photography rights. Supply Apple and Google developer accounts and signing credentials through their platform workflows. Compile a signed Android build and a signed iOS build and test on physical devices, including file selection, reopening after a cold start, poor connectivity, Arabic text and system accessibility settings.
3. The mobile build check compiles the Android debug app and iOS Simulator target. The Google Play workflow prepares an upload-key-signed App Bundle. The shared iOS Release scheme and Xcode Cloud hook prepare the app for external TestFlight distribution. A signed store upload, beta review and physical device installation each require verification in the agency's accounts.

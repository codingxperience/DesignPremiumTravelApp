# Cross World Travel

The traveller app runs on Android, iOS and the web from one React and TypeScript client. Capacitor packages the interface into Android Studio and Xcode projects. A Django API, staff desk and email worker share a PostgreSQL database. The traveller app uses the original home screen, destination catalogue and globe navigation. The interactive prototype is also available at `?showcase` in the Vite dev server.

## Run on Windows

Use Node 24, pnpm 11.25 and Python 3.12. From this checkout, run the following in PowerShell.

```powershell
pnpm install --frozen-lockfile
pnpm build
py -3.12 -m venv .venv
./.venv/Scripts/python.exe -m pip install -r server/requirements.txt
./.venv/Scripts/python.exe server/start_local.py
```

Open `http://localhost:8000`. The launcher migrates a local SQLite database, collects staff-console assets and starts the email worker. Local account links are written under `server/.mail`. Open the newest message addressed to your test account. Files in that directory contain short-lived credentials. They are excluded from source control. For UI development, run pnpm dev in a second terminal. The default dev server on port 5173 proxies API requests to port 8000. Use `http://localhost:5173/?showcase` to review the original prototype.

## Try one journey

1. Open **Cairo & Giza** on the home screen, select **Plan this journey**, create an account and follow the verification email to choose a password. Sign in and send the travel request.
2. In a second PowerShell terminal, activate local settings with `$env:TRAVEL_ENV='local'`. Run `./.venv/Scripts/python.exe server/manage.py createsuperuser`. Use this administrator only to manage staff. At /staff/ grant an operator **Staff status** and membership in the **Travel desk** group. Registration from the mobile app always creates an ordinary traveller.
3. As an operator, open the request, add a quote with the total, currency, inclusions and expiry. To ask for a photo, enable **Attachment requested** on that request. Staff can reply through **Messages**.
4. The traveller opens **My requests** and refreshes the travel file to see updates. Accepting a quote records its actual identifier. The operator can then record the supplier, booking reference and confirmed itinerary under **Confirmations**. The traveller can see this in the same file.

## Install on phones

Set VITE_TRAVEL_ORIGIN to the actual HTTPS origin serving Django and build the native clients with pnpm mobile:sync. The origin is public configuration. Keep database, email and signing secrets out of the client and every Vite-prefixed variable. For Android, open android/ in Android Studio. For iOS, open ios/App/App.xcodeproj on a Mac with Xcode. The provisional bundle ID is com.crossworldtravelagency.travel. Confirm it in the agency's developer accounts before signing. Test a physical device on each platform. Native tokens are deliberately held in memory and sign-in is required after a cold restart. A release-source archive contains the projects and build instructions. Generate fresh native web assets with the intended server address before building.

**Build mobile previews** compiles the Android app and the iOS Simulator target on the `mobile-beta` branch. It also runs manually in GitHub Actions. A run with no API origin only checks compilation. Providing a working HTTPS origin enables the Android debug APK artifact.

### Google Play internal testing

1. In the agency's Play Console account, create the app and confirm the Android package name. Create an upload keystore in Android Studio, or reuse the existing upload key if the package is already registered. Keep an agency-controlled backup.
2. Set the GitHub environment **mobile-beta** variable `VITE_TRAVEL_ORIGIN` to the HTTPS origin of the deployed Django service. Add the environment secrets `ANDROID_UPLOAD_KEYSTORE_BASE64` (base64-encoded keystore), `ANDROID_UPLOAD_ALIAS`, `ANDROID_UPLOAD_STORE_PASSWORD` and `ANDROID_UPLOAD_KEY_PASSWORD`. Configure the environment to accept release jobs from the trusted release branch.
3. Run **Build Google Play internal bundle** from Actions. Choose an unused version code greater than the last upload. The job checks both device API origins, builds the release app and verifies the signed bundle. Download the artifact and extract `app-release.aab`.
4. In Play Console, open **Testing → Internal testing**. Set up Play App Signing on the first release, upload the bundle and roll out to the internal track. Add the client's Google account to the testers list. Once the release is available, copy the opt-in link. The client opens that link with the invited account and installs from Google Play.

### iPhone external testing with TestFlight

1. With the agency's Apple Developer membership active, register its bundle ID and create the matching iOS app in App Store Connect. On a Mac, open `ios/App/App.xcodeproj`, select the agency's signing team for the App target, and save the team selection in the project. The shared App scheme archives the Release configuration.
2. Connect the repository and configure the first Xcode Cloud workflow in Xcode. Set the workflow variable `VITE_TRAVEL_ORIGIN` to the deployed Django HTTPS origin. Select the App scheme and add an iOS **Archive** action with **TestFlight and App Store** deployment preparation. The post-clone script checks the API and syncs the production client into Capacitor before Xcode builds.
3. Start the workflow. After Apple processes the signed build, open **TestFlight** in App Store Connect. Create an internal group, then an external group for the client. Add the processed build to the external group, supply the requested beta review details and submit it. Once Apple approves external testing, invite the client by email or enable the group's public link. The client installs Apple's TestFlight app and accepts the invitation.

The agency can enroll and set up the backend in parallel. The first client-device check should include receipt of a verification email, submission of a travel enquiry and retrieval of a staff reply after closing and reopening the app. Guest flight results depend on routes the agency has published.

## Operate the service

The Dockerfile builds the frontend and serves the compiled assets, API and staff console together. Run one web process and one background worker using the same application image and database. In a container, the working directory is /app/server. Run python manage.py migrate --noinput and python manage.py setup_desk once per deployment. The default web command is python serve.py. The worker command is python manage.py work_mail. The worker retries transient email failures and prunes expired links, sessions and throttle counters. Monitor worker liveness, queue age, email delivery failures, disk use and database backups. Perform a restore rehearsal before accepting customer documents.

| Setting | Purpose |
| --- | --- |
| DJANGO_SECRET_KEY | At least 50 random characters supplied by the hosting secret manager. All instances must use the same key. |
| PUBLIC_ORIGIN | Canonical HTTPS origin for account email and public pages. |
| PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD | Private PostgreSQL connection. Production requires verified database TLS. Install the provider CA for libpq, for example through a mounted PGSSLROOTCERT file. |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM | Authenticated agency email over STARTTLS. Verify the sender domain with the email provider. |
| TRUSTED_PROXY_IP | Exact IP of the TLS ingress. Block direct public access to Waitress. Configure that single proxy to overwrite X-Forwarded-For and X-Forwarded-Proto. The app uses the resulting trusted client address for rate limits. |
| BIND_HOST, PORT, WEB_THREADS | Web listener and worker-thread count. Defaults are 0.0.0.0, 8000 and four threads. Size the number of processes/connections to match the database capacity. |
| HSTS_INCLUDE_SUBDOMAINS, HSTS_PRELOAD | Optional flags for an owner who controls HTTPS across the entire domain. Default is off. HSTS for the application host is enabled in production. |

The static site and API share an origin in a browser. The device has a separate CORS allowlist, rejects cookie-authenticated requests and sends a bearer header. Upload traffic must also be bounded at the ingress. Images are limited to one per request and are re-encoded to JPEG without the original name or metadata. Staff downloads require a separate permission. The database is the source of truth for ownership, quotes, sessions, throttle counters and queued work. Additional web processes can use the same database. No throughput target has been certified.

Public paths for your deployed origin are /privacy, /terms and /delete-account. Before publication, confirm the agency contact, legal operator, actual infrastructure providers, backup retention, supplier terms, rights to imagery and the disclosures in both stores. The current app supports agency-assisted bookings. Supplier search, live seat availability, payment capture, refunds and ticket issuance need corresponding commercial integrations if included in the final scope.

## Vercel client review deployment

`Dockerfile.vercel` builds the React client and Django API into one HTTPS service. Django runs in Vercel's Frankfurt region (`fra1`) to stay close to the Supabase EU Central database; Vercel serves static assets through its global CDN. `vercel.json` schedules daily expiry cleanup for the invite-only client test. The generated Vercel URL can be opened on a phone browser and shared with the client. It does not install an Android or iOS package; Play internal testing and TestFlight still use the Capacitor builds described above. A custom domain is optional for the review link.

Connect the public GitHub repository to a Vercel project, select the `container` framework, and use `main` as its production branch. Configure these server-side environment variables for Production:

The container marks itself as running on Vercel, and production accepts only the exact `PUBLIC_ORIGIN`. Keep this review deployment on Production. Preview deployments need their own explicit host and separate environment before they are shared; the app does not trust arbitrary `*.vercel.app` hosts.

| Variable | Use |
| --- | --- |
| `DJANGO_SECRET_KEY` | Random key of at least 50 characters. |
| `PUBLIC_ORIGIN` | Exact HTTPS production origin, such as the project's `vercel.app` URL. |
| `DATABASE_URL` | Supabase shared transaction-pool URL on port 6543 with `pgbouncer=true`. The app forces verified TLS and disables prepared statements. |
| `CRON_SECRET` | Random secret of at least 32 characters for Vercel's scheduled requests. |
| `TRAVEL_INVITE_ONLY` | Defaults to `1` in the Vercel image. Email and password testers use an invite code. |
| `GOOGLE_OAUTH_CLIENT_ID` | Optional Google Web application client ID. Enables Google sign-in when both Google values are set. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secret for the same Google OAuth client. Set only in the backend environment. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Verified transactional email sender over STARTTLS when public account emails are enabled. |

Keep `DATABASE_URL`, SMTP credentials, `DJANGO_SECRET_KEY`, and `CRON_SECRET` in Vercel's encrypted environment settings. Never expose them through `VITE_*` variables. Do not add the Supabase service-role key to this app; Django uses PostgreSQL directly and enforces the existing per-user access rules.

For shared Supabase pooler hosts, Django uses the bundled [Supabase Root 2021 CA](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt) with hostname verification. This public certificate is used for both runtime and migration connections and expires in April 2031. Set `PGSSLROOTCERT` to the path of a replacement CA file if Supabase rotates the certificate before then.

For a one-off schema migration, temporarily add the Supabase session-pool URL as the Production `DIRECT_URL` secret, then run Django with `TRAVEL_MIGRATIONS=1` through `vercel env run`. This selects `DIRECT_URL` only for that command. Remove `DIRECT_URL` after the migration. Run `setup_desk` once, then create the agency's staff administrator through the production management command. Do not put schema migrations in the container startup command.

Invite-only mode keeps guest search and password sign-in open. With the review environment variables set, run `python server/manage.py issue_invite tester@example.com` and give the tester the code privately. Select **Create an account**, enter the invitation email and code, and choose a password. The code expires after 24 hours or its first successful use. Issuing a new code replaces the previous one for that email. Existing testers can sign in with their current password.

To enable Google sign-up and sign-in during the beta, create an OAuth client of type **Web application** in Google Cloud. Add the production origin followed by `/auth/google/callback` to **Authorized redirect URIs** (for example, `https://design-premium-travel-app.vercel.app/auth/google/callback`). Choose an External audience so client accounts outside your organisation can sign in. The app only requests the basic identity scopes `openid`, `email` and `profile`. Apply the Django migrations and redeploy after adding the Google credentials.

Google can create a traveller account with the user's verified email and name while `TRAVEL_INVITE_ONLY=1`. Email and password testers can still use their existing accounts. Installed clients must include the Google callback handler. Rebuild them after changing the bundle identifier or public origin.

To open email-based signup, configure the verified email sender, add the `/internal/cron/mail` job with schedule `* * * * *` to `vercel.json`, and set `TRAVEL_INVITE_ONLY` to `0` before redeploying. Verify account setup and password reset email delivery before sharing the public launch link.

## Search and Egypt approval

A cold start at the root plays the bundled Cross World launch film and opens the guest home. Direct links open their destination immediately. Guests can search in English or Arabic. The travel desk can maintain dated flight options under **Published flights** in the staff console. Only published flights matching the route, date, cabin, stops and local departure time are returned. If no flights match, the traveller can request a quote with the same itinerary.

For Egypt security approval, add the agency-approved two-letter passport country codes under **Approval countries**. Leave the list empty until the agency supplies it. Eligible travellers attach a JPEG or PNG image of their flight ticket, up to 2 MB. The desk reviews the ticket before applying. A regular Egypt holiday enquiry remains separate.

Travellers can select **Profile → Currency** or choose GBP or USD on the enquiry. The desk sees the requested currency and issues a quote in a specified currency. Preview-only catalogue estimates use the historical [Federal Reserve DEXUSUK observation](https://fred.stlouisfed.org/data/DEXUSUK) of 1.2376 USD per GBP on 2 January 2025.

## Verification commands

```powershell
$env:TRAVEL_ENV = 'local'
./.venv/Scripts/python.exe server/manage.py test travel
./.venv/Scripts/python.exe server/manage.py makemigrations --check --dry-run
pnpm typecheck
pnpm build
pnpm audit
pnpm exec playwright install chromium
node scripts/mobile-smoke.cjs
```

The smoke test targets an isolated local server, selects a random email and deletes its account on success. Set SMOKE_PYTHON to your virtual environment's interpreter if it is not active. The Chromium executable and local origin can be selected with BROWSER_PATH and SMOKE_ORIGIN. PostgreSQL concurrency tests run when the local test settings include the PG connection variables. Use a disposable database role with test database creation permission. See VERIFICATION.md for the actual run and remaining release work.

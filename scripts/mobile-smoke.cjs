const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs/promises"),
  path = require("node:path"),
  { randomUUID } = require("node:crypto"),
  assert = require("node:assert/strict");
(async () => {
  const origin = process.env.SMOKE_ORIGIN || "http://127.0.0.1:8000";
  if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
    throw Error("Use an isolated local database and file email for this test.");
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_PATH || undefined,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    page.setDefaultTimeout(30000);
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    const email = "qa-" + randomUUID() + "@example.test",
      password = "qa-" + randomUUID();
    await page.addInitScript(() => {
      window.sawLaunch = false;
      new MutationObserver(() => {
        if (document.querySelector("[data-splash-mode]")) window.sawLaunch = true;
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.sawLaunch);
    assert.equal(
      (await page.request.get(origin + "/brand/splash/cross-world-intro.mp4")).status(),
      200,
    );
    await page.getByRole("heading", { name: "The world, booked in minutes." }).waitFor();
    const carousel = page.locator('[aria-roledescription="carousel"]');
    await carousel.locator("img").last().evaluate((image) => image.decode());
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("heading", { name: "Your paperwork, handled." }).waitFor();
    await carousel.locator("img").last().evaluate((image) => image.decode());
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("heading", { name: "Sacred journeys, with care." }).waitFor();
    await carousel.locator("img").last().evaluate((image) => image.decode());
    await page.getByRole("button", { name: "Get started", exact: true }).click();
    await page.getByRole("heading", { name: "Create your account", exact: true }).waitFor();
    await page.goto(origin + "/#onboarding");
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await page.getByRole("heading", { name: "Where to next?" }).waitFor();
    await page
      .getByAltText("Cairo & Giza", { exact: true })
      .first()
      .evaluate((i) => i.decode());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("article")).opacity === "1" &&
        [...document.querySelectorAll("article img")]
          .slice(0, 2)
          .every(
            (img) => img.complete && img.naturalWidth && getComputedStyle(img).opacity === "1",
          ),
    );
    if (process.env.SMOKE_SCREENSHOT) await page.screenshot({ path: process.env.SMOKE_SCREENSHOT });
    await page.goto(origin + "/#search");
    const search = page.getByRole("textbox");
    for (const [term, service] of [
      ["flight", "Flights"],
      ["hotel", "Hotels"],
      ["holiday", "Holidays"],
      ["umrah", "Umrah & Hajj"],
      ["visa", "Visa assistance"],
      ["Egypt security approval", "Egypt approval"],
    ]) {
      await search.fill(term);
      await page.getByRole("button", { name: service, exact: true }).waitFor();
    }
    await page.goto(origin + "/#flights");
    await page.getByRole("radio", { name: "Multi-city" }).click();
    await page.getByRole("button", { name: "Add another flight" }).click();
    await page.getByRole("button", { name: "Search flights", exact: true }).click();
    await page.getByRole("heading", { name: "Flight options" }).waitFor();
    const [filtered] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/flight-search") && r.request().postDataJSON().stops === "direct",
      ),
      page.getByRole("combobox", { name: "Stops", exact: true }).selectOption("direct"),
    ]);
    assert.equal(filtered.status(), 200);
    assert.equal((await filtered.json()).results.length, 3);
    await page
      .getByRole("combobox", { name: "Departure time", exact: true })
      .selectOption("evening");
    await page.getByRole("button", { name: "Request flight quote" }).click();
    await page.getByRole("heading", { name: "Welcome back" }).waitFor();
    await page.goto(origin + "/#hotels");
    await page.getByRole("button", { name: /Guests/ }).click();
    await page
      .getByRole("group", { name: "Rooms", exact: true })
      .getByRole("button")
      .last()
      .click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: /Guests.*2 rooms/i }).waitFor();
    await page.goto(origin + "/#egypt");
    await page.getByText(/flight ticket is required/i).waitFor();
    const eligible = await (await page.request.get(origin + "/api/approval-countries")).json();
    if (!eligible.countries.length) await page.getByText(/Applications will open/).waitFor();
    await page.goto(origin + "/#home");
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByRole("radio", { name: "USD ($)", exact: true }).click();
    await page.getByRole("radio", { name: "العربية" }).click();
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    await page.getByRole("radio", { name: "English" }).click();
    await page.getByRole("button", { name: "Explore", exact: true }).click();
    await page.getByRole("button", { name: "Explore Cairo & Giza", exact: true }).click();
    await page.getByRole("button", { name: "Plan this journey" }).click();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "30 minutes" }).waitFor();
    const mailDir = process.env.SMOKE_MAIL_DIR || path.resolve("server/.mail");
    let token;
    const { execFileSync } = require("node:child_process");
    execFileSync(process.env.SMOKE_PYTHON || "python", ["server/manage.py", "deliver_mail"], {
      stdio: "ignore",
    });
    // The running worker can claim delivery before the command above.
    const deadline = Date.now() + 15000;
    while (!token && Date.now() < deadline) {
      for (const file of await fs.readdir(mailDir)) {
        const text = await fs.readFile(path.join(mailDir, file), "utf8");
        if (text.includes("To: " + email)) token = text.match(/#setup=([A-Za-z0-9_-]+)/)?.[1];
        if (token) break;
      }
      if (!token) await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(token, "local email contains registration link");
    await page.goto(origin + "/#setup=" + token);
    await page.getByLabel("Password", { exact: true }).fill(password);
    const [redemption] = await Promise.all([
      page.waitForResponse((r) => r.url() === origin + "/api/password"),
      page.getByRole("button", { name: "Save password" }).click(),
    ]);
    assert.ok(
      redemption.ok(),
      "Password setup returned " +
        redemption.status() +
        ": " +
        (redemption.ok() ? "" : (await redemption.json()).error),
    );
    await page.getByText("Your password is ready.", { exact: false }).waitFor();
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("heading", { name: "Where to next?" }).waitFor();
    await page.getByRole("button", { name: "Explore Cairo & Giza", exact: true }).click();
    await page.getByRole("button", { name: "Plan this journey" }).click();
    assert.equal(await page.getByLabel("Destination or route").inputValue(), "Cairo & Giza");
    assert.equal(
      await page
        .getByRole("combobox", { name: "Preferred quote currency", exact: true })
        .inputValue(),
      "USD",
    );
    const countries = page.getByRole("combobox", { name: "Country calling code", exact: true });
    assert.ok((await countries.locator("option").count()) > 230);
    await countries.selectOption("UG");
    await page.getByLabel("Contact phone (optional)").fill("0772123456");
    assert.equal(await page.locator('input[name="phone"]').inputValue(), "+256772123456");
    await page
      .getByLabel("Departure date")
      .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Send travel request" }).click();
    await page.getByText("Request received").waitFor();
    await page.getByRole("button", { name: "Message the travel desk" }).click();
    await page.getByLabel("Type a message", { exact: false }).fill("Is the itinerary flexible?");
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByText("Is the itinerary flexible?", { exact: true }).waitFor();
    await page.reload();
    await page.getByText("Is the itinerary flexible?", { exact: true }).waitFor();
    await page.goto(origin + "/privacy");
    await page.getByRole("heading", { name: "Privacy" }).waitFor();
    await page.goto(origin + "/delete-account");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Delete your account", exact: true }).click();
    await page.getByRole("heading", { name: "Where to next?" }).waitFor();
    assert.equal((await page.request.get(origin + "/api/trips")).status(), 401);
    assert.deepEqual(pageErrors, []);
    console.log(
      "PASS: launch, six guest services, multi-city filters, rooms, eligibility, phone, USD, RTL, email verification, enquiry, messaging and deletion.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});

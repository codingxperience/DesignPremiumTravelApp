// Check the anonymous device API from each origin used by the installed app.
const address = process.env.VITE_TRAVEL_ORIGIN;
if (!address || !URL.canParse(address)) throw new Error("Set VITE_TRAVEL_ORIGIN to the hosted travel API origin.");
const url = new URL(address);
if (url.protocol !== "https:" || url.origin !== address)
  throw new Error("The travel API must use a bare HTTPS origin with no path or credentials.");

async function read(route, origin, status) {
  const response = await fetch(new URL("/mobile/" + route, url), {
    headers: { Origin: origin, Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== status || response.headers.get("Access-Control-Allow-Origin") !== origin ||
      response.headers.get("Content-Type")?.split(";")[0] !== "application/json")
    throw new Error(`The device API failed the ${route} check for ${origin} (HTTP ${response.status}).`);
  return response.json();
}

for (const origin of ["https://localhost", "capacitor://localhost"]) {
  const session = await read("session", origin, 200);
  if (session?.email !== null || session?.csrf !== null)
    throw new Error("The server did not return an anonymous device session.");
  const eligibility = await read("approval-countries", origin, 200);
  if (!Array.isArray(eligibility?.countries)) throw new Error("The server did not return the eligibility list.");
  await read("trips", origin, 401);
}
console.log("The hosted API accepts Android and iPhone guests and protects private travel requests.");

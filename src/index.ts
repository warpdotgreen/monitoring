import { Hono, Context } from "hono";
import { serve } from "@hono/node-server";
import { addConnection, isRelayConnected } from "./connections";
import { Validator } from "./types";
import { isPubkeyParticipating } from "./events";

const app = new Hono();

const config = require(process.env.CONFIG || "../config.json");

// connect to each validator and track events
config.validators.forEach(addConnection);

// check route for all validators
// (more efficient for custom monitoring applications)
app.get("/status", async (c: Context) => {
  console.log("check all validators")
  
  const resp: Record<string, string> = {};
  for(const validator of config.validators) {
    const pubkey = validator.pubkey;

    if (!isRelayConnected(validator.relay)) {
      console.log("check for", validator.relay, "FAILED (not connected)");
      resp[pubkey] = "Relay is not connected";
      continue;
    }

    if (!(await isPubkeyParticipating(pubkey))) {
      console.log("check for", validator.relay, "FAILED (not participating)");
      resp[pubkey] = "Pubkey does not participate in signing";
      continue;
    }

    console.log("check for", validator.relay, "OK");
    resp[pubkey] = "OK";
  }

  return c.json(resp, 200);
});

// check route (for use in monitoring application)
app.get("/check/:pubkey", async (c: Context) => {
  const pubkey = c.req.param("pubkey");

  // get validator from pubkey
  const validator = config.validators.find(
    (validator: Validator) => validator.pubkey === pubkey
  );

  if (!validator) {
    return c.json({ error: "Unknown Pubkey" }, 400);
  }

  if (!isRelayConnected(validator.relay)) {
    console.log("check for", validator.relay, "FAILED (not connected)");
    return c.json({ error: "Relay is not connected" }, 500);
  }

  if (!(await isPubkeyParticipating(pubkey))) {
    console.log("check for", validator.relay, "FAILED (not participating)");
    return c.json({ error: "Pubkey does not participate in signing" }, 500);
  }

  console.log("check for", validator.relay, "OK");

  // all good!
  return c.body(null, 204);
});

app.get("/metrics/:pubkey", async (c: Context) => {
  const pubkey = c.req.param("pubkey");

  // get validator from pubkey
  const validator = config.validators.find(
    (validator: Validator) => validator.pubkey === pubkey
  );

  const online = validator && isRelayConnected(validator.relay) && (await isPubkeyParticipating(pubkey));

  const metrics = `# HELP validator_status Validator status (1 for Nostr relay up & validator signing messages, 0 for something wrong)
# TYPE validator_status gauge
validator_status ${online ? 1 : 0}
`;

  return c.body(metrics, 200, { "Content-Type": "text/plain" });
});

serve(
  {
    fetch: app.fetch,
    port: parseInt(process.env.PORT) || 3030,
    hostname: process.env.HOST || "localhost",
  },
  (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`);
  }
);

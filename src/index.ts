import { Hono, Context } from "hono";
import { serve } from "@hono/node-server";
import { addConnection, isRelayConnected } from "./connections";
import { Validator } from "./types";
import { isPubkeyParticipating } from "./events";

const app = new Hono();

const config = require(process.env.CONFIG || "../config.json");

// connect to each validator and track events
config.validators.forEach(addConnection);

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
    return c.json({ error: "Relay is not connected" }, 503);
  }

  if (!isPubkeyParticipating(pubkey)) {
    console.log("check for", validator.relay, "FAILED (not participating)");
    return c.json({ error: "Pubkey does not participate in signing" }, 503);
  }

  console.log("check for", validator.relay, "OK");

  // all good!
  return c.json(null, 204);
});

serve(
  {
    fetch: app.fetch,
    port: parseInt(process.env.PORT) || 3030,
    hostname: process.env.HOSTNAME || "localhost",
  },
  (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`);
  }
);

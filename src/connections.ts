import WebSocket from "ws";
import { addEvent } from "./events";
import { Validator } from "./types";
import { schnorr } from "noble-secp256k1";

const connectedRelays: { [key: string]: boolean } = {};

export function addConnection(validator: Validator) {
  let pingInterval: NodeJS.Timeout;
  let pongTimeout: NodeJS.Timeout;

  const ws = new WebSocket(validator.relay, {
    headers: {
      "User-Agent": process.env.AGENT || "validator monitoring",
    },
  });

  const log = (message: string) => {
    console.log(validator.relay, "-", message);
  };

  const reconnect = () => {
    log("disconnected, reconnecting in 5 sec...");

    connectedRelays[validator.relay] = false;

    clearInterval(pingInterval);
    clearTimeout(pongTimeout);

    setTimeout(() => addConnection(validator), 5000);
  };

  const connectTimeout = setTimeout(() => ws.terminate(), 5000);

  ws.on("open", () => {
    clearTimeout(connectTimeout);

    log("connected");

    connectedRelays[validator.relay] = true;

    ws.send(
      JSON.stringify([
        "REQ",
        "events",
        { kinds: [1], limit: 500, authors: [validator.pubkey] },
      ])
    );

    // ping every 10s, if no pong is received within the timeout, terminate
    pingInterval = setInterval(() => {
      ws.ping();
      pongTimeout = setTimeout(() => ws.terminate(), 5000);
    }, 10000);
  });

  ws.on("message", function message(data) {
    try {
      const event = JSON.parse(data.toString());

      // ignore non-event messages or events not from this validator
      if (event[0] !== "EVENT" || event[2].pubkey !== validator.pubkey) return;

      // ignore old events (older than 24h)
      if (event[2].created_at < Date.now() / 1000 - 3600 * 24) return;

      if (!schnorr.verify(event[2].sig, event[2].id, validator.pubkey)) {
        log("invalid signature");
        return;
      }

      // event has r & c tags -> it's a bridging tx
      if (event[2]?.tags[0]?.[0] === "r" && event[2]?.tags[1]?.[0] === "c") {
        const rc = event[2].tags[0][1] + event[2].tags[1][1];

        log(`event: ${event[2].tags[0][1]} ${event[2].tags[1][1]}`);

        addEvent({
          rc,
          pubkey: validator.pubkey,
          created_at: event[2].created_at,
        });
      }
    } catch (err) {
      // log("could not parse message: " + data.toString());
    }
  });

  ws.on("close", reconnect);
  ws.on("error", () => ws.terminate());
  ws.on("pong", () => clearTimeout(pongTimeout));
}

export function isRelayConnected(relay: string): boolean {
  return !!connectedRelays[relay];
}

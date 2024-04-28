"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const connections_1 = require("./connections");
const events_1 = require("./events");
const app = new hono_1.Hono();
const config = require(process.env.CONFIG || "../config.json");
// connect to each validator and track events
config.validators.forEach(connections_1.addConnection);
// check route (for use in monitoring application)
app.get("/check/:pubkey", (c) => __awaiter(void 0, void 0, void 0, function* () {
    const pubkey = c.req.param("pubkey");
    // get validator from pubkey
    const validator = config.validators.find((validator) => validator.pubkey === pubkey);
    if (!validator) {
        return c.json({ error: "Unknown Pubkey" }, 400);
    }
    if (!(0, connections_1.isRelayConnected)(validator.relay)) {
        console.log("check for", validator.relay, "FAILED (not connected)");
        return c.json({ error: "Relay is not connected" }, 500);
    }
    if (!(0, events_1.isPubkeyParticipating)(pubkey)) {
        console.log("check for", validator.relay, "FAILED (not participating)");
        return c.json({ error: "Pubkey does not participate in signing" }, 500);
    }
    console.log("check for", validator.relay, "OK");
    // all good!
    return c.json(null, 204);
}));
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: config.port,
    hostname: config.hostname,
}, (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`);
});

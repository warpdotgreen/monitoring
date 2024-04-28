"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRelayConnected = exports.addConnection = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("./events");
const noble_secp256k1_1 = require("noble-secp256k1");
const connectedRelays = {};
function addConnection(validator) {
    let pingInterval;
    let pongTimeout;
    const ws = new ws_1.default(validator.relay, {
        headers: {
            "User-Agent": process.env.AGENT || "validator monitoring",
        },
    });
    const log = (message) => {
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
        // NOTE: pubkey filter is not working in current nostr-rs-relay
        // authors: [validator.pubkey]
        // https://github.com/scsibug/nostr-rs-relay/issues/189
        ws.send(JSON.stringify(["REQ", "events", { kinds: [1], limit: 500 }]));
        // ping every 10s, if no pong is received within the timeout, terminate
        pingInterval = setInterval(() => {
            ws.ping();
            pongTimeout = setTimeout(() => ws.terminate(), 5000);
        }, 10000);
    });
    ws.on("message", function message(data) {
        var _a, _b, _c, _d;
        try {
            const event = JSON.parse(data.toString());
            // ignore non-event messages or events not from this validator
            if (event[0] !== "EVENT" || event[2].pubkey !== validator.pubkey)
                return;
            if (!noble_secp256k1_1.schnorr.verify(event[2].sig, event[2].id, validator.pubkey)) {
                log("invalid signature");
                return;
            }
            // event has r & c tags -> it's a bridging tx
            if (((_b = (_a = event[2]) === null || _a === void 0 ? void 0 : _a.tags[0]) === null || _b === void 0 ? void 0 : _b[0]) === "r" && ((_d = (_c = event[2]) === null || _c === void 0 ? void 0 : _c.tags[1]) === null || _d === void 0 ? void 0 : _d[0]) === "c") {
                const rc = event[2].tags[0][1] + event[2].tags[1][1];
                log("event: " + rc);
                (0, events_1.addEvent)({
                    rc,
                    pubkey: validator.pubkey,
                    created_at: event[2].created_at,
                });
            }
        }
        catch (err) {
            // log("could not parse message: " + data.toString());
        }
    });
    ws.on("close", reconnect);
    ws.on("error", () => ws.terminate());
    ws.on("pong", () => clearTimeout(pongTimeout));
}
exports.addConnection = addConnection;
function isRelayConnected(relay) {
    return connectedRelays[relay];
}
exports.isRelayConnected = isRelayConnected;

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
exports.isPubkeyParticipating = exports.addEvent = void 0;
const events = {};
function addEvent(event) {
    return __awaiter(this, void 0, void 0, function* () {
        // first time seeing this event?
        if (!events[event.rc]) {
            events[event.rc] = {
                created_at: event.created_at * 1000,
                pubkeys: [],
            };
        }
        // add pubkey to event, this tells us that the pubkey has signed this event
        events[event.rc].pubkeys.push(event.pubkey);
        // determine newest event
        const newest = Object.values(events).reduce((acc, curr) => {
            return acc.created_at > curr.created_at ? acc : curr;
        });
        // remove previous events older than 5 minutes but keep the newest event
        for (const rc in events) {
            if (events[rc] === newest)
                continue;
            if (events[rc].created_at < Date.now() - 5 * 60 * 1000) {
                delete events[rc];
            }
        }
    });
}
exports.addEvent = addEvent;
// checks if pubkey has signed all recent events
// this could be either the last known event or all events from the last 5 minutes
function isPubkeyParticipating(pubkey) {
    const pubkeys = Object.values(events)
        .filter((event) => event.created_at < Date.now() - 10000) // exclude brand new events (might not have propagated yet)
        .map((event) => event.pubkeys);
    return pubkeys.every((pubs) => pubs.length > 0 && pubs.includes(pubkey));
}
exports.isPubkeyParticipating = isPubkeyParticipating;

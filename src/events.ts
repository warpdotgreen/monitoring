import { RecentEvents, SignedEvent } from "./types";

const events: RecentEvents = {};

export async function addEvent(event: SignedEvent) {
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
    if (events[rc] === newest) continue;

    if (events[rc].created_at < Date.now() - 5 * 60 * 1000) {
      delete events[rc];
    }
  }
}

// checks if pubkey has signed all recent events
// this could be either the last known event or all events from the last 5 minutes
export function isPubkeyParticipating(pubkey: string): boolean {
  const pubkeys = Object.values(events)
    .filter((event) => event.created_at < Date.now() - 10000) // exclude brand new events (might not have propagated yet)
    .map((event) => event.pubkeys);

  return pubkeys.every((pubs) => pubs.length > 0 && pubs.includes(pubkey));
}

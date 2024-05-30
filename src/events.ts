import sqlite3 from "sqlite3";
import { SignedEvent, StoredEvent } from "./types";

const db = new sqlite3.Database(process.env.DB_PATH || "./events.db", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    rc TEXT PRIMARY KEY,
    created_at TIMESTAMP,
    pubkeys TEXT
  )`);
});

export async function addEvent(event: SignedEvent) {
  // add event to db or add pubkey to existing event
  db.run(
    `INSERT INTO events (rc, created_at, pubkeys)
    VALUES (?, ?, json(?))
    ON CONFLICT(rc) DO UPDATE SET
      pubkeys = CASE
          WHEN NOT EXISTS (
              SELECT 1
              FROM json_each(events.pubkeys)
              WHERE json_each.value = ?
          ) THEN json_insert(pubkeys, '$[' || json_array_length(pubkeys) || ']', ?)
          ELSE pubkeys
      END,
      created_at = CASE WHEN created_at > ? THEN ? ELSE created_at END`,
    [
      event.rc,
      event.created_at,
      JSON.stringify([event.pubkey]),
      event.pubkey,
      event.pubkey,
      event.created_at,
      event.created_at,
    ]
  );
}

// checks if pubkey has signed the most recent event
// (recent event must be at least 60 seconds old and have at least 3 signers)
export function isPubkeyParticipating(pubkey: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT pubkeys FROM events
      WHERE created_at <= strftime('%s','now') - 60
      AND json_array_length(pubkeys) >= 3
      ORDER BY created_at DESC LIMIT 1`,
      (err, row: StoredEvent) => {
        if (err) {
          console.error("Error querying event", err.message);
          reject(err);
        } else {
          resolve(row && JSON.parse(row.pubkeys).includes(pubkey));
        }
      }
    );
  });
}

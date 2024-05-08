export interface Validator {
  pubkey: string;
  relay: string;
}

export interface SignedEvent {
  rc: string;
  created_at: number;
  pubkey: string;
}

export interface StoredEvent {
  rc: string;
  created_at: number;
  pubkeys: string;
}

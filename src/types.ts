export interface Validator {
  pubkey: string;
  relay: string;
}

export interface SignedEvent {
  rc: string;
  created_at: number;
  pubkey: string;
}

export interface RecentEvents {
  [key: string]: {
    created_at: number;
    pubkeys: string[];
  };
}

# warp.green Validator Monitoring

A small tool to monitor validators of the warp.green bridge. It checks if a validators relay is reachable and if the validators public key participates in signing messages. It starts a local webserver for querying the current status of a specific validator, which can be added to any monitoring service (BetterUptime, etc.).

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`
4. Rename `config.json.example` to `config.json` and add one more validators to monitor
5. Run `npm start`

### Query Validator Status

Query the status of a validator by sending a GET request to `/check/{validators_pubkey}`. The response will be either `204` on success, or `500` on failure with a JSON containing the error.

# warp.green Validator Monitoring

This is a helper tool to monitor validators of the [warp.green bridge](https://warp.green). It checks if validators relay events and sign messages. It starts a local webserver for querying the current status of a validator, which can be added to any monitoring or alert service (BetterStack, etc.).

Note: This tool only compares events between validators by connecting to each validators relay, it does not follow the blockchain and does not know if a validator is actually part of the bridge.

## Getting Started

1. Clone the repository
2. `npm install`
3. `npm run build`
4. `npm start`

### Query Validator Status

Query the status of a validator by sending a GET request to `/check/{validators_pubkey}`. The response will be either `204` on success, or `503` on failure with a JSON containing the error.

## Example

The status page on [warp-validators.bufflehead.org](https://warp-validators.bufflehead.org) is based on this tool (using a [BetterStack](http://betterstack.com) frontend).

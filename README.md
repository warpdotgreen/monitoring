# warp.green Validator Monitoring

This is a helper tool for monitoring the uptime of [warp.green](https://warp.green) bridge validators. It checks whether validators are relaying events and signing messages, and it runs a local webserver for querying the current status of a validator. This allows it to be added to any monitoring or alert service, such as BetterStack.

Note: This tool only compares events between validators by connecting to each validators relay. It does not follow the blockchain and does not know if a validator is actually part of the bridge. Thus, it will not detect if all validators fail.

## Getting Started

1. Clone the repository
2. `npm install`
3. `npm run build`
4. `npm start`

### Query Validator Status

Query the status of a validator by sending a GET request to `/check/{validators_pubkey}`. The response will be either `204` on success, or `503` on failure with a JSON containing the error.

## Example

The status page on [warp-validators.bufflehead.org](https://warp-validators.bufflehead.org) is based on this tool (using a [BetterStack](http://betterstack.com) frontend).

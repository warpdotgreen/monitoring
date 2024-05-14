# warp.green Validator Monitoring

This is a helper tool for monitoring the uptime of [warp.green](https://warp.green) bridge validators. It checks whether validators are relaying events and signing messages, and it runs a local webserver for querying the current status of a validator. This allows it to be added to any monitoring or alert service, such as Alertmanager or BetterStack.

Note: This tool only compares events between validators by connecting to each validators relay. It does not follow the blockchain and does not know if a validator is actually part of the bridge. Thus, it will not detect if all validators fail.

## Getting Started

### Docker from source
```bash
git clone https://github.com/warpdotgreen/monitoring.git -b main
cd monitoring

docker build . -t monitoring
cp config.testnet.json config.json
touch events.db
docker run -it \
  -e "AGENT='your agent here'" \
  -v "$(pwd)"/config.json:/app/config.json \
  -v "$(pwd)"/events.db:/app/events.db \
  -p  3030:3030 \
  monitoring
```

### Build from source

1. Clone the repository: `git clone https://github.com/warpdotgreen/monitoring.git -b main; cd monitorng`
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run server: `npm start`

### Don't build from source

For each commit on `main`, a Docker container is automatically built by GitHub Actions and published to:
```
ghcr.io/warpdotgreen/monitoring:main
```

## Example

The status page on [warp-validators.bufflehead.org](https://warp-validators.bufflehead.org) is based on this tool (using a [BetterStack](http://betterstack.com) frontend).

### Query Validator Status

Query the status of a validator by sending a GET request to `/check/{validators_nostr_pubkey}`. The response will be either `204` on success, or `500` on failure with a JSON containing the error.

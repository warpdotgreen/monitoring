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
  -e "AGENT=your agent here" \
  -e "HOST=0.0.0.0" \
  -v "$(pwd)"/config.json:/app/config.json \
  -v "$(pwd)"/events.db:/app/events.db \
  -p  3030:3030 \
  monitoring
```

### Build from source

1. Clone the repository: `git clone https://github.com/warpdotgreen/monitoring.git -b main; cd monitoring`
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

## Prometheus / Alertmanager

Assuming you have followed [these](https://github.com/eth-educators/ethstaker-guides/blob/main/monitoring.md) [guides](https://github.com/eth-educators/ethstaker-guides/blob/main/alerting.md) to monitor your Ethereum node, monitoring your overall validator status is trivial. Note that we're using `localhost:3030` here, but you have probably received an external monitoring URL.

First, in `/etc/prometheus/prometheus.yml`, add the job below. Make sure to replace `{your-nostr-pubkey}` with your Nostr public key (no leading `0x`), and change the target accordingly.

```bash
  - job_name: 'validator_outside_status'
    metrics_path: '/metrics/{your-nostr-pubkey}'
    static_configs:
      - targets: ['localhost:3030']
```

If you're using SSL, you'll also have to add `scheme: https`. Example value:

```bash
  - job_name: 'validator_outside_status'
    metrics_path: '/metrics/cd5fd0859c3a27c13dd9734b7cdc6f2c25646e45821dcecaa089808803d01706'
    static_configs:
      - targets: ['status-api.warp.green:443']
    scheme: https
```

To create an alert when your validator is down, add the following to your `/etc/prometheus/alert_rules.yml`:

```
  - alert: ValidatorDown
    expr: validator_status == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Validator is down"
      description: "The Nostr server is unreachable or the validator is no longer signing messages."
```

Lastly, make sure to restart your services so the new rules are in effect:

```bash
service prometheus restart
service alertmanager restart
```

You can check the rule's existence in the 'Alert rules' section of the Grafa Dashboard.

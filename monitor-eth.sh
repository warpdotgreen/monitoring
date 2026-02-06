#!/bin/bash

# Configuration
MY_ETH_MONITORING_URL="[paste-your-Ethereum-monitoring-URL-here]"
MY_ETH_RPC_URL="http://127.0.0.1:8545" # may need to change this as well; rpc_url is in your config.json!

PREV_HEIGHT=""
echo "Starting Ethereum Height Monitor..."

while true; do
    OUTPUT=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "$MY_ETH_RPC_URL")
    CURRENT_HEIGHT=$(echo "$OUTPUT" | python3 -c "import sys, json; print(int(json.load(sys.stdin).get('result', '0'), 16))" 2>/dev/null)

    if [[ "$CURRENT_HEIGHT" =~ ^[0-9]+$ ]] && [ "$CURRENT_HEIGHT" -gt 0 ]; then
        if [[ "$CURRENT_HEIGHT" != "$PREV_HEIGHT" ]]; then
            echo -n "[$(date)] Sending ping for new height $CURRENT_HEIGHT... "
            curl -s "$MY_ETH_MONITORING_URL?status=up&ping=&msg=$CURRENT_HEIGHT"
            echo

            PREV_HEIGHT="$CURRENT_HEIGHT"
        fi
    else
        echo "[$(date)] Warning: Could not retrieve a valid height from $MY_ETH_RPC_URL"
    fi

    sleep 60
done

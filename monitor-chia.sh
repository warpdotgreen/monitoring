#!/bin/bash

# Configuration
MY_CHIA_MONITORING_URL="[paste-your-Chia-monitoring-URL-here]"

PREV_HEIGHT=""
echo "Starting Chia Height Monitor..."

while true; do
    OUTPUT=$(chia rpc full_node get_blockchain_state 2>/dev/null)
    CURRENT_HEIGHT=$(echo "$OUTPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('blockchain_state', {}).get('peak', {}).get('height', ''))" 2>/dev/null)

    if [[ "$CURRENT_HEIGHT" =~ ^[0-9]+$ ]]; then
        if [[ "$CURRENT_HEIGHT" != "$PREV_HEIGHT" ]]; then
            echo -n "[$(date)] Sending ping for new height $CURRENT_HEIGHT... "
            curl -s "$MY_CHIA_MONITORING_URL?status=up&ping=&msg=$CURRENT_HEIGHT"
            echo

            PREV_HEIGHT="$CURRENT_HEIGHT"
        fi
    else
        echo "[$(date)] Warning: Could not retrieve a valid height."
    fi

    sleep 120
done

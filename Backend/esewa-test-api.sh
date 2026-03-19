#!/bin/bash

# eSewa Test API Helper Script
# Usage: ./esewa-test-api.sh [command] [options]

BASE_URL="http://localhost:4000"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== eSewa Test API Helper ===${NC}\n"

# Get test credentials
get_credentials() {
    echo -e "${YELLOW}Fetching eSewa test credentials...${NC}"
    curl -s -X GET "${BASE_URL}/api/esewa-test/credentials" | jq "."
}

# Generate test payload
generate_payload() {
    local amount="${1:100}"
    local tax="${2:0}"
    local service="${3:0}"
    local delivery="${4:0}"
    
    echo -e "${YELLOW}Generating test payment payload...${NC}"
    echo "Amount: ${amount}, Tax: ${tax}, Service: ${service}, Delivery: ${delivery}"
    
    curl -s -X POST "${BASE_URL}/api/esewa-test/generate-payload" \
        -H "Content-Type: application/json" \
        -d "{
            \"amount\": \"${amount}\",
            \"tax_amount\": \"${tax}\",
            \"service_charge\": \"${service}\",
            \"delivery_charge\": \"${delivery}\"
        }" | jq "."
}

# Verify test payment
verify_payment() {
    local uuid="$1"
    local amount="${2:100}"
    
    if [ -z "$uuid" ]; then
        echo -e "${YELLOW}ERROR: Transaction UUID required${NC}"
        echo "Usage: $0 verify <transaction_uuid> [amount]"
        return 1
    fi
    
    echo -e "${YELLOW}Verifying test payment: ${uuid}${NC}"
    
    curl -s -X POST "${BASE_URL}/api/esewa-test/verify" \
        -H "Content-Type: application/json" \
        -d "{
            \"transaction_uuid\": \"${uuid}\",
            \"total_amount\": \"${amount}\"
        }" | jq "."
}

# Show help
show_help() {
    echo -e "${GREEN}Available commands:${NC}"
    echo ""
    echo "  credentials              - Get eSewa test credentials and endpoints"
    echo "  payload [amount]         - Generate test payment payload"
    echo "                            Amount default: 100, min: 1"
    echo "  verify <uuid> [amount]   - Verify a test payment"
    echo "  help                     - Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./esewa-test-api.sh credentials"
    echo "  ./esewa-test-api.sh payload 150"
    echo "  ./esewa-test-api.sh payload 200 10 5 50"
    echo "  ./esewa-test-api.sh verify TEST-1234567890-ABC123"
    echo ""
}

# Main command handler
case "$1" in
    credentials)
        get_credentials
        ;;
    payload)
        generate_payload "$2" "$3" "$4" "$5"
        ;;
    verify)
        verify_payment "$2" "$3"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${YELLOW}No command specified or unknown command${NC}\n"
        show_help
        ;;
esac

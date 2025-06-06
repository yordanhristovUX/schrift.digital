#!/bin/bash

# Script to test deployed Supabase Edge Functions
# This will make HTTP requests to test if functions are working

echo "🧪 Testing deployed Supabase Edge Functions..."

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL environment variable must be set"
    echo "Example: export SUPABASE_URL=https://your-project.supabase.co"
    exit 1
fi

# Check if SUPABASE_ANON_KEY is set
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_ANON_KEY environment variable must be set"
    exit 1
fi

BASE_URL="$SUPABASE_URL/functions/v1"
AUTH_HEADER="Authorization: Bearer $SUPABASE_ANON_KEY"

echo "🌐 Base URL: $BASE_URL"
echo ""

# Test functions
FUNCTIONS=(
    "test-function"
    "generate-sitemap"
    "get-price"
)

for func in "${FUNCTIONS[@]}"; do
    echo "🔍 Testing function: $func"
    
    # Test GET request
    echo "  📥 GET request..."
    response=$(curl -s -w "\n%{http_code}" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        "$BASE_URL/$func")
    
    # Extract HTTP status code (last line)
    http_code=$(echo "$response" | tail -n1)
    # Extract response body (all lines except last)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo "  ✅ Success (HTTP $http_code)"
        echo "  📄 Response: $(echo "$response_body" | jq -r '.message // .success // "OK"' 2>/dev/null || echo "$response_body" | head -c 100)"
    else
        echo "  ❌ Failed (HTTP $http_code)"
        echo "  📄 Response: $response_body"
    fi
    
    echo ""
done

# Test POST request to test-function
echo "🔍 Testing POST request to test-function..."
echo "  📤 POST request with JSON data..."

post_response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello from test script!", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
    "$BASE_URL/test-function")

post_http_code=$(echo "$post_response" | tail -n1)
post_response_body=$(echo "$post_response" | head -n -1)

if [ "$post_http_code" = "200" ]; then
    echo "  ✅ Success (HTTP $post_http_code)"
    echo "  📄 Response: $(echo "$post_response_body" | jq -r '.message // "OK"' 2>/dev/null || echo "$post_response_body" | head -c 100)"
else
    echo "  ❌ Failed (HTTP $post_http_code)"
    echo "  📄 Response: $post_response_body"
fi

echo ""
echo "🎉 Function testing complete!"
echo "💡 You can also test functions manually at: $BASE_URL/test-function"
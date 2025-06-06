#!/bin/bash

# Script to delete all deployed Supabase Edge Functions
# This will remove functions from Supabase but keep local files

echo "🧹 Cleaning up deployed Supabase Edge Functions..."

# Check if required environment variables are set
if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_ID environment variables must be set"
    echo "You can find these in your Supabase dashboard:"
    echo "- Access Token: https://supabase.com/dashboard/account/tokens"
    echo "- Project ID: In your project settings"
    exit 1
fi

# List of functions to delete (based on your current function folders)
FUNCTIONS=(
    "stripe-checkout"
    "stripe-webhook" 
    "get-price"
    "manage-subscription"
    "generate-sitemap"
    "test-function"
)

echo "📋 Functions to delete: ${FUNCTIONS[*]}"
echo ""

# Delete each function
for func in "${FUNCTIONS[@]}"; do
    echo "🗑️  Deleting function: $func"
    
    # Use Supabase CLI to delete the function
    supabase functions delete "$func" --project-ref "$SUPABASE_PROJECT_ID" --force
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deleted: $func"
    else
        echo "⚠️  Failed to delete or function doesn't exist: $func"
    fi
    echo ""
done

echo "🎉 Cleanup complete! All functions have been processed."
echo "💡 You can now deploy fresh functions using: npm run deploy:functions"
#!/bin/bash
# Style and quality checks for modified files

# Don't exit on errors initially - we want to handle them gracefully
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Running style and quality checks..."

# Function to check a single file
check_file() {
    local file_path="$1"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${YELLOW}⚠️  File not found: $file_path${NC}"
        return 0
    fi
    
    echo "📁 Checking file: $file_path"
    
    # Markdown files
    if [[ "$file_path" == *.md ]]; then
        echo "📝 Checking Markdown format..."
        
        # Check for EARS format in requirements files
        if [[ "$file_path" == *requirements.md ]]; then
            if ! grep -q "WHEN.*THE SYSTEM SHALL" "$file_path" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  WARNING: Requirements file should use EARS format${NC}"
                echo "   Format: 'WHEN [trigger], THE SYSTEM SHALL [behavior]'"
            fi
        fi
        
        # Check for proper headings structure
        if ! grep -q "^# " "$file_path" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  WARNING: Missing main heading (# Title)${NC}"
        fi
    fi
    
    # YAML files
    if [[ "$file_path" == *.yml ]] || [[ "$file_path" == *.yaml ]]; then
        echo "📋 Checking YAML syntax..."
        if command -v yamllint &> /dev/null; then
            if ! yamllint "$file_path" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  YAML formatting issues detected${NC}"
            fi
        fi
    fi
    
    # JSON files  
    if [[ "$file_path" == *.json ]]; then
        echo "🔧 Checking JSON syntax..."
        if ! python3 -m json.tool "$file_path" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  JSON formatting issues detected${NC}"
        fi
    fi
    
    # Python files
    if [[ "$file_path" == *.py ]]; then
        echo "🐍 Checking Python syntax..."
        if ! python3 -m py_compile "$file_path" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Python syntax issues detected${NC}"
        fi
    fi
    
    # JavaScript files
    if [[ "$file_path" == *.js ]]; then
        echo "🟨 Checking JavaScript syntax..."
        if command -v node &> /dev/null; then
            if ! node -c "$file_path" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  JavaScript syntax issues detected${NC}"
            fi
        fi
    fi
    
    # Check for common issues
    echo "🔍 Checking for common issues..."
    
    # Check for TODO/FIXME without context (suppress errors)
    if grep -n "TODO\|FIXME" "$file_path" 2>/dev/null | grep -v "TODO:" | grep -v "FIXME:" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  WARNING: Found TODO/FIXME without proper context${NC}"
        echo "   Use format: TODO: [description] or FIXME: [description]"
    fi
    
    # Check for sensitive information patterns (but allow common development terms)
    if grep -i "password\|secret\|key\|token" "$file_path" 2>/dev/null | grep -v -E "password-field|secret-management|key-value|api-key|jwt-secret|token-refresh|password-hash|secret-key" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  WARNING: Potential sensitive information detected${NC}"
        echo "   Review file for hardcoded secrets or passwords"
    fi
    
    echo -e "${GREEN}✅ Checks completed for $file_path${NC}"
}

# Get the file path from various possible sources
FILE_PATH="${1:-$CLAUDE_MODIFIED_FILE}"

# If no file path provided, check recently modified files in the project
if [ -z "$FILE_PATH" ]; then
    echo "📝 No specific file provided, checking recently modified files..."
    
    # Find recently modified files (last 5 minutes) excluding hidden dirs and common ignored files
    RECENT_FILES=$(find . -type f -mmin -5 \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./coverage/*" \
        -not -path "./.claude/notification.log" \
        -name "*.md" -o -name "*.json" -o -name "*.js" -o -name "*.py" -o -name "*.yml" -o -name "*.yaml" \
        | head -5)
    
    if [ -z "$RECENT_FILES" ]; then
        echo -e "${GREEN}✅ No recent file modifications detected${NC}"
        exit 0
    fi
    
    # Check each recent file
    for file in $RECENT_FILES; do
        echo "📁 Checking recently modified file: $file"
        check_file "$file"
    done
    
    echo -e "${GREEN}✅ All recent file checks completed${NC}"
    exit 0
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${YELLOW}⚠️  File not found: $FILE_PATH (may have been deleted)${NC}"
    exit 0
fi

# If we have a specific file path, check it
check_file "$FILE_PATH"

echo -e "${GREEN}✅ All style checks completed successfully${NC}"
exit 0
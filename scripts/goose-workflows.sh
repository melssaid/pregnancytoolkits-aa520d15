#!/bin/bash
# Goose Development Workflows Helper
# مساعد سير العمل مع Goose
# This script provides quick access to common Goose development tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Goose is installed
check_goose_installed() {
    if ! command -v goose &> /dev/null; then
        print_error "Goose is not installed!"
        echo ""
        echo "Please install Goose first:"
        echo "  • macOS/Linux: brew install goose-ai/tap/goose"
        echo "  • Rust: cargo install goose"
        echo ""
        echo "For more details, see: GOOSE_SETUP.md"
        exit 1
    fi
    print_success "Goose is installed: $(goose --version)"
}

# Check if API key is configured
check_api_key() {
    if [ -z "$OPENAI_API_KEY" ] && [ ! -f "$HOME/.goose/config.toml" ]; then
        print_warning "No API key found!"
        echo ""
        echo "Configure your API key:"
        echo "  1. Create ~/.goose/config.toml"
        echo "  2. Add your LLM configuration"
        echo "  3. Or set: export OPENAI_API_KEY='sk-...'"
        echo ""
        echo "For more details, see: GOOSE_SETUP.md"
        return 1
    fi
    print_success "API key is configured"
    return 0
}

# Validate project setup
validate_project() {
    print_info "Validating project setup..."
    
    if [ ! -f ".gorules" ]; then
        print_error ".gorules file not found!"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Run this from the project root."
        exit 1
    fi
    
    print_success "Project validation passed"
}

# Show help
show_help() {
    cat << EOF
${BLUE}🦆 Goose Development Workflows Helper${NC}

${GREEN}USAGE:${NC}
  ./scripts/goose-workflows.sh [command] [options]

${GREEN}COMMANDS:${NC}

  ${YELLOW}new-tool${NC}
    Interactive workflow to create a new tool
    Usage: ./scripts/goose-workflows.sh new-tool

  ${YELLOW}write-tests${NC}
    Ask Goose to write tests for a file
    Usage: ./scripts/goose-workflows.sh write-tests src/pages/tools/MyTool.tsx

  ${YELLOW}generate-translations${NC}
    Generate translations from English to Arabic
    Usage: ./scripts/goose-workflows.sh generate-translations

  ${YELLOW}improve-docs${NC}
    Improve code documentation and add JSDoc
    Usage: ./scripts/goose-workflows.sh improve-docs src/services/myService.ts

  ${YELLOW}fix-bugs${NC}
    Interactive session to fix bugs
    Usage: ./scripts/goose-workflows.sh fix-bugs

  ${YELLOW}optimize${NC}
    Optimize code performance
    Usage: ./scripts/goose-workflows.sh optimize src/pages/tools/MyTool.tsx

  ${YELLOW}review${NC}
    Get Goose to review a file
    Usage: ./scripts/goose-workflows.sh review src/pages/tools/MyTool.tsx

  ${YELLOW}check${NC}
    Check Goose setup and configuration
    Usage: ./scripts/goose-workflows.sh check

  ${YELLOW}help${NC}
    Show this help message

${GREEN}EXAMPLES:${NC}

  # Create a new tool with Goose guidance
  ./scripts/goose-workflows.sh new-tool

  # Write tests for a specific tool
  ./scripts/goose-workflows.sh write-tests src/pages/tools/CycleTracker.tsx

  # Generate Arabic translations
  ./scripts/goose-workflows.sh generate-translations

${GREEN}TIPS:${NC}
  • Review all Goose suggestions before applying
  • Always run 'npm run test' after changes
  • Validate translations with 'npm run validate:locales'
  • Check .gorules for project guidelines

${GREEN}MORE INFO:${NC}
  See GOOSE_SETUP.md for detailed instructions
  Visit https://goose-docs.ai/ for official documentation

EOF
}

# Workflow: Create new tool
workflow_new_tool() {
    print_info "Starting new tool creation workflow..."
    echo ""
    echo "This workflow will guide you through creating a complete tool:"
    echo "  1. Tool generation"
    echo "  2. Translations"
    echo "  3. Test creation"
    echo "  4. Documentation"
    echo ""
    
    read -p "Tool name (e.g., AI Meditation Guide): " TOOL_NAME
    
    if [ -z "$TOOL_NAME" ]; then
        print_error "Tool name is required"
        exit 1
    fi
    
    # Check if project is healthy
    npm run lint > /dev/null 2>&1 || print_warning "Linting errors found (this is OK)"
    
    print_info "Starting Goose interactive session..."
    echo ""
    echo "You'll be in an interactive Goose session. Here's what to ask:"
    echo ""
    echo "1. First request:"
    echo "   'Create a new pregnancy tool called \"$TOOL_NAME\"'"
    echo "   Explain what the tool should do."
    echo ""
    echo "2. After component is created:"
    echo "   'Now write comprehensive tests for the $TOOL_NAME tool'"
    echo ""
    echo "3. For translations:"
    echo "   'Add translations to src/locales for this tool'"
    echo ""
    echo "4. For documentation:"
    echo "   'Add JSDoc and inline documentation'"
    echo ""
    echo "Type 'exit' or press Ctrl+D to leave Goose"
    echo "---"
    echo ""
    
    goose
    
    print_success "Tool creation workflow completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run lint --fix"
    echo "  2. Run: npm run test"
    echo "  3. Run: npm run validate:locales"
    echo "  4. Review changes: git diff"
    echo "  5. Commit: git add . && git commit -m \"feat: add $TOOL_NAME tool\""
}

# Workflow: Write tests
workflow_write_tests() {
    FILE="$1"
    
    if [ -z "$FILE" ]; then
        read -p "Enter file path (e.g., src/pages/tools/MyTool.tsx): " FILE
    fi
    
    if [ ! -f "$FILE" ]; then
        print_error "File not found: $FILE"
        exit 1
    fi
    
    print_info "Starting test writing workflow for: $FILE"
    echo ""
    
    goose << EOF
Please write comprehensive unit tests for the file: $FILE

The tests should include:
1. Component rendering tests
2. User interaction tests
3. State management tests
4. Edge cases
5. Error handling

Use the vitest framework (already in the project).
Save tests in a __tests__ directory or as .test.tsx files.
EOF
    
    print_success "Test writing completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Review tests: npm run test:watch"
    echo "  2. Fix any issues: npm run test"
    echo "  3. Commit: git add . && git commit -m \"test: add tests for $(basename $FILE)\""
}

# Workflow: Generate translations
workflow_generate_translations() {
    print_info "Starting translation generation workflow..."
    echo ""
    
    goose << EOF
I need to generate Arabic translations for the Pregnancy Toolkits project.

Please:
1. Review the current tools in src/lib/tools-data.ts
2. Generate proper Arabic translations for:
   - Tool titles
   - Tool descriptions
   - UI labels and buttons
   - Help text

Format the output as JSON matching the structure in:
- src/locales/ar.json
- src/locales/en.json

Make sure translations are:
- Accurate and culturally appropriate
- Consistent with existing terminology
- Clear and professional
EOF
    
    print_success "Translation generation completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Validate: npm run validate:locales"
    echo "  2. Review translations"
    echo "  3. Commit: git add . && git commit -m \"i18n: update translations\""
}

# Workflow: Improve documentation
workflow_improve_docs() {
    FILE="$1"
    
    if [ -z "$FILE" ]; then
        read -p "Enter file path (e.g., src/services/myService.ts): " FILE
    fi
    
    if [ ! -f "$FILE" ]; then
        print_error "File not found: $FILE"
        exit 1
    fi
    
    print_info "Starting documentation improvement for: $FILE"
    echo ""
    
    goose << EOF
Please improve the documentation for: $FILE

Add:
1. JSDoc comments for all functions and classes
2. TypeScript type annotations
3. Inline comments for complex logic
4. Usage examples in comments
5. Parameter and return value documentation

Make the documentation clear enough for other developers to understand the code.
EOF
    
    print_success "Documentation improvement completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff $FILE"
    echo "  2. Commit: git add . && git commit -m \"docs: improve documentation for $(basename $FILE)\""
}

# Workflow: Fix bugs
workflow_fix_bugs() {
    print_info "Starting bug fixing workflow..."
    echo ""
    
    # Run lint to find issues
    print_info "Running linter to find issues..."
    LINT_OUTPUT=$(npm run lint 2>&1 || true)
    
    if echo "$LINT_OUTPUT" | grep -q "error"; then
        echo ""
        echo "Found linting errors:"
        echo "$LINT_OUTPUT" | head -20
        echo ""
        echo "Asking Goose to fix these issues..."
        echo ""
        
        goose << EOF
Please fix these issues in the codebase:

$LINT_OUTPUT

Focus on:
1. TypeScript errors
2. ESLint violations
3. Type safety issues
EOF
    else
        print_warning "No linting errors found"
        echo ""
        echo "You can describe a specific bug you want to fix:"
        read -p "Describe the bug: " BUG_DESCRIPTION
        
        if [ ! -z "$BUG_DESCRIPTION" ]; then
            goose << EOF
Please help me fix this bug:

$BUG_DESCRIPTION

Include:
1. Root cause analysis
2. The fix
3. Test cases to prevent regression
EOF
        fi
    fi
    
    print_success "Bug fixing workflow completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Test: npm run test"
    echo "  2. Lint: npm run lint"
    echo "  3. Commit: git add . && git commit -m \"fix: resolve issues\""
}

# Workflow: Optimize code
workflow_optimize() {
    FILE="$1"
    
    if [ -z "$FILE" ]; then
        read -p "Enter file path (e.g., src/pages/tools/MyTool.tsx): " FILE
    fi
    
    if [ ! -f "$FILE" ]; then
        print_error "File not found: $FILE"
        exit 1
    fi
    
    print_info "Starting optimization for: $FILE"
    echo ""
    
    goose << EOF
Please optimize: $FILE

Focus on:
1. Rendering performance (React optimization)
2. Memory usage
3. Bundle size impact
4. Unnecessary re-renders
5. Algorithm efficiency

Provide improvements that:
- Don't break existing functionality
- Maintain readability
- Follow React best practices
- Are tested
EOF
    
    print_success "Optimization completed!"
    echo ""
    echo "Next steps:"
    echo "  1. Test: npm run test"
    echo "  2. Verify: npm run build"
    echo "  3. Commit: git add . && git commit -m \"perf: optimize $(basename $FILE)\""
}

# Workflow: Review code
workflow_review() {
    FILE="$1"
    
    if [ -z "$FILE" ]; then
        read -p "Enter file path for review: " FILE
    fi
    
    if [ ! -f "$FILE" ]; then
        print_error "File not found: $FILE"
        exit 1
    fi
    
    print_info "Starting code review for: $FILE"
    echo ""
    
    goose << EOF
Please review the following file: $FILE

Provide feedback on:
1. Code quality and style
2. TypeScript type safety
3. Performance considerations
4. Security issues
5. Best practices adherence
6. Potential bugs
7. Documentation completeness

Suggest improvements with explanations.
EOF
    
    print_success "Code review completed!"
}

# Workflow: Check setup
workflow_check() {
    print_info "Checking Goose setup..."
    echo ""
    
    check_goose_installed
    echo ""
    
    check_api_key || {
        print_warning "API key not configured, but you can still try Goose"
    }
    echo ""
    
    validate_project
    echo ""
    
    # Check Node.js and npm
    print_info "Checking development environment..."
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
    echo ""
    
    # Check project dependencies
    if npm list > /dev/null 2>&1; then
        print_success "Project dependencies are installed"
    else
        print_warning "Some dependencies may be missing. Run 'npm install'"
    fi
    echo ""
    
    print_success "Setup check completed!"
    echo ""
    echo "You're ready to use Goose!"
    echo "Start with: ./scripts/goose-workflows.sh new-tool"
}

# Main logic
main() {
    COMMAND="${1:-help}"
    
    case $COMMAND in
        new-tool)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_new_tool
            ;;
        write-tests)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_write_tests "$2"
            ;;
        generate-translations)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_generate_translations
            ;;
        improve-docs)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_improve_docs "$2"
            ;;
        fix-bugs)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_fix_bugs
            ;;
        optimize)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_optimize "$2"
            ;;
        review)
            check_goose_installed
            check_api_key || exit 1
            validate_project
            workflow_review "$2"
            ;;
        check)
            validate_project
            workflow_check
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"

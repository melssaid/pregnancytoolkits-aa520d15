# 🦆 Goose AI Agent Setup Guide
# دليل إعداد Goose AI Agent

> Goose is an open-source AI agent that can install, execute, edit, and test code. This guide explains how to use Goose with the Pregnancy Toolkits project.

## 📋 Table of Contents / جدول المحتويات

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Official Reference and Governance](#official-reference-and-governance)
4. [Use Cases](#use-cases)
5. [Common Workflows](#common-workflows)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Installation / التثبيت

### Prerequisites / المتطلبات الأساسية

- **Node.js 18+** - Already installed in your project
- **npm or yarn** - Package manager
- **Rust** (for Goose) - Install from https://rustup.rs/
- **API Key** - Get one from:
  - OpenAI (https://platform.openai.com/api-keys)
  - Anthropic Claude (https://console.anthropic.com/)
  - Google Gemini (https://ai.google.dev/)

### Step 1: Install Goose / الخطوة 1: تثبيت Goose

```bash
# Using Homebrew (macOS/Linux)
brew install goose-ai/tap/goose

# Using Cargo (Universal - Rust)
cargo install goose

# Using Docker
docker run -it gooseai/goose:latest
```

**For more installation options**, visit: https://goose-docs.ai/installation

### Step 2: Configure API Keys / الخطوة 2: إعداد مفاتيح API

Create or edit the Goose config file:

```bash
# Create config directory
mkdir -p ~/.goose

# Create config.toml
nano ~/.goose/config.toml
```

Add your preferred LLM configuration:

```toml
# Option 1: OpenAI
[llm.openai]
api_key = "sk-..."
model = "gpt-4-turbo"  # or "gpt-3.5-turbo" for faster responses

# Option 2: Anthropic Claude
[llm.anthropic]
api_key = "sk-ant-..."
model = "claude-3-opus-20240229"  # or "claude-3-sonnet" for faster responses

# Option 3: Google Gemini
[llm.google]
api_key = "..."
model = "gemini-pro"
```

### Step 3: Verify Installation / الخطوة 3: التحقق من التثبيت

```bash
goose --version
goose auth check
```

---

## Configuration / التخصيص

### Goose Rules File (.gorules)

The `.gorules` file in this repository contains project-specific rules for Goose. It includes:

- ✅ Project structure guidelines
- ✅ Code style preferences
- ✅ Protected areas (files Goose should not modify)
- ✅ Technology stack information
- ✅ Common commands

**The `.gorules` file is automatically loaded when you run Goose in this directory.**

---

## Official Reference and Governance

### Single Source of Truth

- `GOOSE_SETUP.md` = the official reference for AI-assisted workflows.
- `.gorules` = execution and quality rules.
- `scripts/goose-workflows.sh` = standardized executable workflows.
- Lovable (the AI app builder assistant used by this project team) can be used, but it must follow the same governance and evidence rules documented here.

### Documented Source of Answers (Required)

For every AI-assisted change, capture:

1. Prompt used.
2. Tool and model used.
3. Execution time (UTC).
4. Affected files.
5. commit SHA.

Use:

```bash
./scripts/goose-workflows.sh trace-run
```

This creates a trace record under `artifacts/ai-trace/`.

### Documented Source of Results (Required)

Each AI output must be linked to:

- `npm run lint`
- `npm run test`
- `npm run validate:locales`
- CI logs/artifacts (when available)

The trace record shows **PASS/FAIL** and links to evidence files.

### Quality & Governance

- Add a confidence indicator to each AI answer (`high`, `medium`, `low`).
- Mark whether human review is required.
- Human review is mandatory when confidence is low, checks fail, or sensitive files are touched.
- Track monthly KPIs:
  - Test success rate.
  - Number of ESLint fixes.
  - End-to-end delivery time.

Recommended KPI formulas:

- Test success rate = `(passed test runs / total test runs) × 100`.
- ESLint fixes count = total number of fixed violations from lint runs (manual + `--fix`) during the month.
- Delivery time = time from AI prompt start to merged commit (median per month).

Store monthly KPI snapshots in your team reporting channel or dashboard and keep the metric names aligned with `.gorules`.

---

## Use Cases / حالات الاستخدام

### 1. Adding a New Tool / إضافة أداة جديدة

```bash
# Start Goose in the project directory
cd /path/to/pregnancytoolkits-aa520d15
goose
```

**Ask Goose:**

```
Please help me create a new pregnancy tool called "AI Meditation Guide"

The tool should:
1. Create a React component in src/pages/tools/AiMeditationGuide.tsx
2. Add translations to src/locales/ar.json and src/locales/en.json
3. Register the tool in src/lib/tools-data.ts
4. Include meditation exercises for each trimester
5. Use Tailwind CSS and shadcn/ui components
6. Include smooth animations with Framer Motion
```

### 2. Writing Tests / كتابة الاختبارات

```bash
goose
```

**Ask Goose:**

```
Please write comprehensive unit tests for src/pages/tools/CycleTracker.tsx

Include tests for:
- Date calculation logic
- State management
- User interactions
- localStorage integration
```

### 3. Improving Code Documentation / تحسين التوثيق

```bash
goose
```

**Ask Goose:**

```
Please review src/services/smartEngine/ and add:
- JSDoc comments for all functions
- Type definitions
- Usage examples in comments
```

### 4. Generating Translations / توليد الترجمات

```bash
goose
```

**Ask Goose:**

```
I need to translate the tool descriptions from English to Arabic.

Here are the tool titles and descriptions in English:
- "Weight Gain Guide": "Track healthy weight gain throughout pregnancy"
- "Fetal Growth": "Monitor fetal development week by week"

Please generate the Arabic translations and format them as JSON for src/locales/ar.json
```

### 5. Refactoring and Optimization / إعادة الهيكلة والتحسين

```bash
goose
```

**Ask Goose:**

```
Please analyze src/pages/tools/PregnancyAssistant.tsx for:
1. Performance optimizations
2. Code quality improvements
3. TypeScript type safety
4. Unused imports

Provide suggestions and implement the most important ones.
```

### 6. Bug Fixing / إصلاح الأخطاء

```bash
goose
```

**Ask Goose:**

```
The app is showing a hydration mismatch warning in the console.
Can you:
1. Identify where this is coming from
2. Fix the issue
3. Test the fix
```

---

## Common Workflows / سير العمل الشائع

### Workflow 1: Complete Tool Development / تطوير أداة كاملة

```bash
# Step 1: Start Goose
goose

# Step 2: Ask for complete tool creation
# "Create a new tool called 'AI Birth Coach' with..."

# Step 3: Ask for tests
# "Write comprehensive tests for the AI Birth Coach tool"

# Step 4: Ask for documentation
# "Add JSDoc and inline documentation"

# Step 5: Test locally
npm run dev

# Step 6: Run linting and tests
npm run lint
npm run test

# Step 7: Commit changes
git add .
git commit -m "feat: add AI Birth Coach tool"
```

### Workflow 2: Quick Bug Fix / إصلاح سريع

```bash
# Find the issue
npm run lint

# Start Goose
goose

# Ask for fix
# "There's an ESLint error in src/pages/tools/... Please fix it"

# Test the fix
npm run lint
npm run test

# Commit
git add .
git commit -m "fix: resolve ESLint error"
```

### Workflow 3: Performance Optimization / تحسين الأداء

```bash
# Run tests
npm run test

# Start Goose
goose

# Ask for optimization
# "Please optimize the rendering performance of..."

# Verify no regressions
npm run test
npm run dev
```

---

## Best Practices / أفضل الممارسات

### ✅ Do's / ما يجب فعله

- ✓ Always review Goose's suggestions before applying them
- ✓ Run tests after Goose makes changes: `npm run test`
- ✓ Commit changes incrementally with clear messages
- ✓ Use `.gorules` to guide Goose's behavior
- ✓ Keep API keys secure (use environment variables)
- ✓ Run linting before committing: `npm run lint`
- ✓ Test on multiple screen sizes (responsive design)
- ✓ Validate translations: `npm run validate:locales`

### ❌ Don'ts / ما يجب تجنبه

- ✗ Don't let Goose modify protected files without review
- ✗ Don't commit untested code
- ✗ Don't ignore TypeScript errors
- ✗ Don't forget about Arabic and English translations
- ✗ Don't modify `.github/workflows/` without understanding CI/CD
- ✗ Don't add dependencies without checking for vulnerabilities
- ✗ Don't push directly without running: `npm run lint && npm run test`

### Project-Specific Considerations / اعتبارات خاصة بالمشروع

1. **Bilingual Support** - All new tools must have Arabic and English translations
2. **Privacy First** - Data is stored locally by default
3. **Accessibility** - Use semantic HTML and ARIA labels
4. **Mobile-First** - Design for mobile, then scale up
5. **Performance** - Keep bundle size minimal
6. **Type Safety** - Always use TypeScript strict mode

---

## Troubleshooting / استكشاف الأخطاء

### Problem: "API key not found"

**Solution:**
```bash
# Check your Goose config
cat ~/.goose/config.toml

# Or set the key via environment variable
export OPENAI_API_KEY="sk-..."
goose
```

### Problem: "Goose is making incorrect changes"

**Solution:**
1. Press `Ctrl+C` to stop Goose
2. Review the changes with `git diff`
3. Revert with `git checkout .`
4. Start Goose again with more specific instructions

### Problem: "Tests fail after Goose's changes"

**Solution:**
```bash
# See what tests are failing
npm run test

# Ask Goose specifically
# "The test for [specific test name] is failing. Can you fix it?"

# Revert if needed
git checkout .
```

### Problem: "Goose won't modify a file"

**Solution:**
- The file might be in the protected areas list (check `.gorules`)
- Or Goose needs clearer instructions
- Try asking more specifically: "Edit src/pages/tools/MyTool.tsx to..."

### Problem: "Cannot connect to LLM provider"

**Solution:**
1. Check your internet connection
2. Verify API key is correct and has balance
3. Try a different LLM provider
4. Check provider's status page

---

## Advanced Usage / الاستخدام المتقدم

### Using Goose in CI/CD Pipeline

While Goose is primarily a developer tool, you can use it in GitHub Actions:

```yaml
# .github/workflows/goose-assist.yml
name: Goose Code Review

on: [pull_request]

jobs:
  goose-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Goose
        run: cargo install goose
      - name: Run Goose Analysis
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          goose << EOF
          Please review the changes in this PR and provide:
          1. Code quality assessment
          2. Potential bugs or issues
          3. Performance concerns
          EOF
```

### Custom Goose Rules

Edit `.gorules` to customize Goose's behavior for your needs:

```yaml
ai_assistance:
  capabilities:
    - "Your custom capability here"
```

---

## Resources / الموارد

- 📚 **Official Docs**: https://goose-docs.ai/
- 🐙 **GitHub**: https://github.com/aaif-goose/goose
- 💬 **Discord Community**: https://discord.gg/goose-community
- 🎓 **Tutorials**: https://goose-docs.ai/tutorials
- 🐛 **Issue Tracker**: https://github.com/aaif-goose/goose/issues

---

## FAQ / الأسئلة الشائعة

**Q: Does Goose cost money?**
A: Goose itself is free and open-source. However, you may pay for LLM API usage (OpenAI, Claude, Gemini).

**Q: Can Goose delete files?**
A: Goose can delete files, but it's careful about it. Review all changes before applying.

**Q: Is Goose good for beginners?**
A: Yes! Goose is excellent for learning. It can explain its changes and help you understand the code.

**Q: Can I use Goose offline?**
A: Not yet. Goose requires an internet connection to communicate with LLM providers.

**Q: Should I commit Goose's changes immediately?**
A: No. Always review, test, and validate before committing.

---

## Getting Help / الحصول على المساعدة

1. **Check `.gorules`** - It contains project guidelines for Goose
2. **Read this guide** - Most questions are answered here
3. **Ask in the project discussions** - Open an issue on GitHub
4. **Visit Goose docs** - https://goose-docs.ai/

---

## Next Steps / الخطوات التالية

1. ✅ Install Goose: `cargo install goose` or `brew install goose-ai/tap/goose`
2. ✅ Configure API key in `~/.goose/config.toml`
3. ✅ Start using Goose: `cd /path/to/pregnancytoolkits && goose`
4. ✅ Report back with your experience in GitHub discussions

---

<div align="center">

**Happy coding with Goose! 🦆**

**استمتع بالبرمجة مع Goose!**

</div>

# Contributing to Sentineli

First off, thank you for considering contributing to Sentineli! This project aims to bridge the gap between legacy COBOL systems and modern AI technologies, and we welcome contributions from the mainframe community and beyond.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, Docker version)
- **Logs or screenshots** if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Use case** - Why is this enhancement needed?
- **Proposed solution** - How should it work?
- **Alternatives considered** - What other approaches did you consider?

### Pull Requests

We actively welcome pull requests for:

- Bug fixes
- New features
- Documentation improvements
- Performance optimizations
- Test coverage improvements

## Development Setup

### Prerequisites

- **Docker** and **Docker Compose** (required)
- **Node.js** 18+ (for local development)
- **GnuCOBOL** 3.1+ (if working on COBOL modules)
- **Git** for version control
- **OpenAI API Key** (for AI features)

### Initial Setup

1. **Fork and clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/SENTINELI-COBOL-KNOWLEDGE-GRAPH.git
cd SENTINELI-COBOL-KNOWLEDGE-GRAPH
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment:**

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

4. **Start the development environment:**

```bash
docker-compose up --build
```

5. **Run tests:**

```bash
npm test
```

### Project Structure

```
/
├── src/
│   ├── cobol/              # COBOL source files
│   │   └── main.cob        # Main business logic
│   ├── bridge/             # Node.js bridge layer
│   │   ├── server.js       # Express API server
│   │   └── ai_agent.js     # AI integration
│   └── lib/                # Shared utilities
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── performance/        # Performance/stress tests
├── docs/                   # Additional documentation
└── .github/                # GitHub templates and workflows
```

## Coding Standards

### JavaScript/Node.js

- **Style:** We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Linting:** ESLint is configured - run `npm run lint`
- **Formatting:** Prettier is used - run `npm run format`
- **Modern syntax:** Use ES6+ features (async/await, arrow functions, destructuring)

**Example:**

```javascript
// Good
async function analyzeCode(filePath) {
  const code = await readFile(filePath);
  return await extractSymbolicConstraints(code);
}

// Avoid
function analyzeCode(filePath, callback) {
  readFile(filePath, function(err, code) {
    if (err) return callback(err);
    // ...
  });
}
```

### COBOL

- **Standard:** Follow COBOL-85 or later standards
- **Free format:** Use free-format COBOL (not fixed)
- **Naming:** Use descriptive names (WS-USER-NAME not WS-UN)
- **Comments:** Document business logic and complex algorithms

**Example:**

```cobol
IDENTIFICATION DIVISION.
PROGRAM-ID. CreditDecision.
AUTHOR. Your Name.

DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-CREDIT-SCORE    PIC 9(3).
01 WS-DECISION        PIC X(20).

PROCEDURE DIVISION.
MAIN-LOGIC.
    *> Evaluate credit worthiness based on score
    IF WS-CREDIT-SCORE >= 700 THEN
        MOVE 'APPROVED' TO WS-DECISION
    ELSE
        MOVE 'DECLINED' TO WS-DECISION
    END-IF.
    STOP RUN.
```

### General Principles

- **DRY (Don't Repeat Yourself)** - Extract common logic
- **SOLID principles** - Write maintainable OO code
- **Security first** - Validate inputs, sanitize outputs
- **Error handling** - Always handle errors gracefully
- **Documentation** - Comment complex logic, maintain README

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no logic change)
- **refactor:** Code refactoring
- **perf:** Performance improvements
- **test:** Adding or updating tests
- **chore:** Maintenance tasks (dependencies, build, etc.)
- **ci:** CI/CD changes

### Examples

```
feat(bridge): add JWT authentication middleware

Implement JWT-based authentication for all API endpoints.
Includes token validation, refresh token support, and
role-based access control.

Closes #42
```

```
fix(cobol): correct debt-to-income calculation

The DTI calculation was using gross income instead of net income,
resulting in incorrect approval decisions.

Fixes #67
```

## Pull Request Process

### Before Submitting

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following coding standards

3. **Add/update tests** - Maintain or improve coverage

4. **Run the test suite:**
   ```bash
   npm test
   npm run lint
   ```

5. **Update documentation** - README, API docs, code comments

6. **Commit your changes** using conventional commits

### Submitting the PR

1. **Push to your fork:**
   ```bash
   git push origin feat/your-feature-name
   ```

2. **Open a Pull Request** with:
   - Clear title following conventional commits
   - Description of changes
   - Link to related issues
   - Screenshots (if UI changes)
   - Checklist completed

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
- [ ] Security implications considered

### Review Process

- **Automated checks** must pass (CI/CD)
- **At least one maintainer review** required
- **Address feedback** - Make requested changes
- **Squash commits** if requested
- **Maintainers will merge** once approved

## Testing Requirements

### Unit Tests

- **Coverage:** Aim for 80%+ code coverage
- **Framework:** Jest for JavaScript, appropriate framework for COBOL
- **Naming:** `*.test.js` or `*.spec.js`
- **Location:** Next to tested file or in `tests/unit/`

**Example:**

```javascript
describe('extractSymbolicConstraints', () => {
  it('should extract decision nodes from COBOL code', async () => {
    const code = 'IF AGE < 18 THEN...';
    const result = await extractSymbolicConstraints(code);
    expect(result.propagator_network.nodes).toHaveLength(2);
  });
});
```

### Integration Tests

- **End-to-end flows** - Test complete request/response cycles
- **Database interactions** - Test with test database
- **External services** - Mock API calls (OpenAI, etc.)
- **Location:** `tests/integration/`

### Performance Tests

- **Benchmarks** - Ensure changes don't degrade performance
- **Load tests** - Test under stress conditions
- **Location:** `tests/performance/`

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Additional Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](docs/api/README.md)
- [Security Policy](SECURITY.md)
- [GnuCOBOL Documentation](https://gnucobol.sourceforge.io/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## Questions?

- **GitHub Discussions** - For questions and discussions
- **Issues** - For bug reports and feature requests
- **Email** - [contact email if applicable]

## Recognition

Contributors are recognized in:
- [All Contributors](README.md#contributors) list
- Release notes
- Project documentation

Thank you for contributing to Sentineli! 🧠🚀

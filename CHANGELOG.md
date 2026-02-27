# Changelog

All notable changes to SENTINELI Mainframe Knowledge Graph will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🎯 Preparing for v1.0.0 Open Source Release

#### Fixed (2026-02-28)
- **Database Migration**: Automatic schema initialization
  - Added database migration to `predev` and `prestart` hooks
  - Migration now runs automatically when starting the server
  - Fixes "relation 'knowledge_graph' does not exist" error on fresh installs
  - Documented manual migration command in README for Docker users
  - Database tables created: knowledge_graph, executions, users, indexes

#### Added (2026-02-28)
- **🎯 Blast Radius Visualization**: Revolutionary change impact analysis with 3D graph visualization
  - Recursive dependency tracking with configurable depth (supports 12+ node types)
  - MIPS cost impact calculation (total, monthly, annual projections)
  - Risk scoring algorithm (1-10 scale with depth penalties and language-specific weights)
  - Cross-language dependency support (COBOL, JCL, DB2, VSAM, CICS, COPYBOOK)
  - 3D force-directed graph data generation (D3.js/vis.js ready)
  - Node coloring by language and risk level
  - Node sizing by MIPS weight
  - GET `/api/impact/blast-radius/:identifier` endpoint
- **📊 Compliance Report Generator**: One-click regulatory audit reports with formal proofs
  - 5 regulatory report types: SOX 404, Basel III, OCC, SEC, General Banking
  - Comprehensive sections: Executive Summary, Formal Verification, Compliance Status, Risk Assessment, Audit Trail, Recommendations, Certifications, Appendices
  - Z3 proof embedding with SMT-LIB format for mathematical verification
  - HTML report generation with professional styling (PDF-ready architecture)
  - Automated control testing analysis and risk quantification
  - POST `/api/reports/compliance/:type` endpoint
  - GET `/api/reports/types` endpoint
- **🏆 Competitive Advantages**: Three unique capabilities that competitors (IBM, Anthropic) don't offer:
  1. Translation + Formal Verification (we prove correctness, they don't)
  2. Visual Blast Radius with Cost Quantification (we show change impact, they don't)
  3. Automated Compliance Reports with Embedded Proofs (we generate audit documents, they don't)

#### Added (2026-02-25)
- **PM2 Process Management**: Production-ready process manager with auto-restart
  - `ecosystem.config.js` - PM2 configuration for Bridge and Dashboard
  - Startup scripts for Windows (`.bat`/`.ps1`) and Linux/Mac (`.sh`)  
  - Log directory with proper error/output separation
  - NPM scripts: `start:pm2`, `stop:pm2`, `restart:pm2`, `logs:pm2`, `monitor:pm2`
- **Code Quality Tools**:
  - ESLint configuration with recommended rules
  - Prettier configuration for consistent formatting
  - `.eslintignore` and `.prettierignore` files
  - Lint and format scripts in package.json
- **GitHub Templates**:
  - Bug report template
  - Feature request template  
  - Documentation issue template
  - Pull request template
- **Enhanced README**:
  - Prominent Quick Start section (5-minute setup)
  - PM2 startup instructions
  - Clear access URLs and next steps
- **Documentation**:
  - Master plan documentation for open source preparation
  - Quick wins guide for immediate improvements
  - Comprehensive system audit completed
  - Tab mapping guide for all 6 dashboard features

#### Fixed (2026-02-25)
- Bridge service stability with PM2 management (resolves random crashes)
- Error handlers already implemented (uncaughtException, unhandledRejection)
- Graceful shutdown with proper cleanup
- Code quality: No console.log statements in production code

#### Security (2026-02-25)
- `.env.example` updated with comprehensive configuration
- Rate limiting already implemented (express-rate-limit)
- Security audit completed: 1 low severity in PM2 (acceptable)
- No secrets in git (all in .env)
- Logs directory added to .gitignore

#### Changed (2026-02-25)
- Package.json version set to 1.0.0
- Added PM2 startup scripts for all platforms
- Enhanced error messages across all dashboard views
- Improved README structure for better onboarding

---

## [0.9.0] - 2026-02-22 - Pre-Alpha

### Added
- ✨ **AI-Powered COBOL Analysis** - GPT-4o integration for code analysis
- 📊 **Knowledge Graph Visualization** - Interactive program dependency mapping
- 🎯 **Impact Analysis** - Field-level change impact detection
- 📈 **Performance Monitoring** - Real-time system metrics dashboard
- 📝 **System Logs** - Live log streaming with WebSocket
- 🔍 **Ad-hoc Code Analysis** - Paste COBOL code for instant analysis
- 🏗️ **Three-tier Architecture** - Dashboard, Bridge, Gateway services
- 🐳 **Docker Support** - Containerized deployment
- 📖 **Initial Documentation** - Setup guides and architecture docs

### Backend (Node.js Bridge)
- Express.js REST API on port 3000
- OpenAI GPT-4o integration
- PostgreSQL database support (optional)
- WebSocket server for real-time updates
- Health check endpoints
- COBOL program parsing and analysis
- Impact analysis algorithms
- Metrics tracking and aggregation

### Frontend (React Dashboard)
- Vite + React 18 application on port 3102
- Six main dashboard tabs:
  1. System Dashboard - Metrics overview
  2. COBOL Analysis - AI-powered code insights
  3. Impact Analysis - Change impact detection
  4. Knowledge Graph - Visual dependency mapping
  5. System Logs - Real-time log viewer
  6. Performance - System metrics monitoring
- WebSocket integration for live updates
- File upload for COBOL programs
- Responsive design
- Error boundaries and loading states

### Gateway (Rust)
- Optional Rust-based API gateway on port 8080
- Request routing to Bridge service
- (Note: Currently has build issues, marked as optional)

### Infrastructure
- Docker Compose configuration
- Development and production environments
- Environment variable configuration
- Basic CI/CD setup (in progress)

---

## [0.5.0] - 2026-02-15 - Proof of Concept

### Added
- Basic COBOL parsing functionality
- Simple web interface
- OpenAI API integration (initial)
- File upload capability
- Knowledge graph prototype

---

## [0.1.0] - 2026-02-01 - Initial Commit

### Added
- Project structure
- Basic Express server
- React frontend skeleton
- Docker configuration
- README with initial vision

---

## 📅 UPCOMING RELEASES

### [1.0.0] - Target: Q1 2026 - **OPEN SOURCE RELEASE**

**Focus:** Production-ready, fully documented, community-ready

#### Planned Features
- ✅ Comprehensive documentation (README, guides, API docs)
- ✅ Security hardening (authentication, input validation)
- ✅ Test coverage >70%
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Performance optimization
- ✅ Docker production images
- ✅ Sample COBOL programs
- ✅ Community guidelines (Code of Conduct, Contributing)
- ✅ Open source license (MIT/Apache 2.0)
- ✅ Demo video and website

#### Breaking Changes
- API versioning (/api/v1/)
- Authentication required for API access (optional for open source)
- Environment variable naming standardization

---

### [1.1.0] - Target: Q2 2026 - **Community Feedback**

**Focus:** Address community feedback, improve UX

#### Planned Features
- Export functionality (PDF, JSON, CSV)
- Batch file processing
- Enhanced error messages
- Dark mode support
- Improved onboarding experience
- More sample COBOL programs
- Video tutorials
- Plugin system (extensibility)

---

### [1.2.0] - Target: Q3 2026 - **Enterprise Features**

**Focus:** Enterprise adoption, advanced features

#### Planned Features
- User management and roles
- Team workspaces
- Collaboration features (comments, sharing)
- GitHub/GitLab integration
- Advanced analytics and reporting
- Cost optimization recommendations
- SaaS deployment option
- Enterprise support options

---

### [2.0.0] - Target: Q4 2026 - **Multi-Language Support**

**Focus:** Expand beyond COBOL

#### Planned Features
- Support for other legacy languages (FORTRAN, RPG, PL/I)
- Language-agnostic knowledge graph
- Cross-language dependency analysis
- Migration planning tools
- Modernization recommendations
- Architecture transformation guidance

---

## 📊 VERSION NAMING CONVENTION

- **Major (X.0.0)** - Breaking changes, major features
- **Minor (0.X.0)** - New features, backward compatible
- **Patch (0.0.X)** - Bug fixes, security patches

## 🏷️ PRE-RELEASE TAGS

- **-alpha** - Early testing, unstable
- **-beta** - Feature complete, bug fixing
- **-rc** - Release candidate, near final

Example: `1.0.0-rc.1`

---

## 📝 CHANGELOG CATEGORIES

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

---

## 🔗 USEFUL LINKS

- [GitHub Releases](https://github.com/yourusername/sentineli/releases)
- [Documentation](https://sentineli.dev/docs)
- [Roadmap](https://github.com/yourusername/sentineli/projects)
- [Issues](https://github.com/yourusername/sentineli/issues)

---

**Note:** This project is actively developed. Breaking changes may occur before v1.0.0.

*Last Updated: February 25, 2026*

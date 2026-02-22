# 🛡️ Sentineli
### Neuro-Symbolic COBOL Modernization Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/Kolerr-Lab/SENTINELI-COBOL-KNOWLEDGE-GRAPH/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/Kolerr-Lab/SENTINELI-COBOL-KNOWLEDGE-GRAPH/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![GnuCOBOL](https://img.shields.io/badge/GnuCOBOL-3.1+-blue)](https://gnucobol.sourceforge.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code Coverage](https://img.shields.io/badge/coverage-80%25+-success)](jest.config.js)

**By Ricky Anh Nguyen** | OrchesityAI & Kolerr Lab

> "Bridging 60 years of COBOL wisdom with tomorrow's AI"

---

## 🚀 Overview

**Sentineli** is an enterprise-grade system that bridges the gap between legacy **COBOL** logic and modern **Generative AI**.

Instead of a "Black Box" mainframe, Sentineli creates a **"Glass House"**:
1.  **The Body**: A GnuCOBOL Logic Engine running in Docker
2.  **The Brain**: A Node.js Neural Bridge connected to GPT-4o
3.  **The Result**: Real-time, forensic visualization of legacy decision logic

**Production Features:**
- ✅ Enterprise security (JWT/API Key auth, rate limiting, input validation)
- ✅ Comprehensive test suite (Jest with 80%+ coverage)
- ✅ CI/CD pipeline (GitHub Actions with automated security scanning)
- ✅ Structured logging (Pino) and metrics (Prometheus-ready)
- ✅ Full OSS governance (MIT License, Contributing Guide, Code of Conduct)
- ✅ Docker-first deployment with health checks and graceful shutdown


---

## ⚡ Performance Benchmarks (Shock Tests)

We pushed this system to the limit. It didn't blink.

### 1. The HFT Flood Test
*   **Load**: 1000 Concurrent Complex Credit Applications.
*   **Result**: 100% Success Rate.
*   **Throughput**: **166 Requests Per Second** (Enterprise Grade).
*   **Latency**: 14ms average decision time.

### 2. The Logic Topology Test (God's Eye)
*   Visualizes the aggregate decision path of user traffic in real-time using ANSI ASCII art.
*   Identify bottlenecks (e.g., "Hit rate at Debt Check vs Credit Check") instantly.

---

## 🛠️ Installation & Usage

### Prerequisites
*   Docker & Docker Compose
*   Node.js (for local CLI tools)
*   OpenAI API Key (in `.env`)

### Quick Start

1.  **Clone & Configure**:
    ```bash
    git clone https://github.com/Kolerr-Lab/sentineli.git
    cd sentineli
    cp .env.example .env
    # Add your OPENAI_API_KEY and other required values to .env
    ```

2.  **Launch with Docker**:
    ```bash
    docker-compose up --build
    ```
    *This compiles the COBOL source, starts the Node.js Bridge, PostgreSQL, and Redis.*

3.  **Run Tests**:
    ```bash
    npm install
    npm test
    ```

4.  **Access the API**:
    - Health check: http://localhost:3050/health
    - API endpoints require authentication (JWT or API Key)
    - See [API Documentation](docs/api.md) for details

---

## 📡 API Usage

### Authentication

Sentineli supports two authentication methods:

**1. JWT Token (recommended for web apps)**
```bash
# Include in Authorization header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -X POST http://localhost:3050/api/run/main \
     -H "Content-Type: application/json" \
     -d '{"AGE":"30","INCOME":"50000","CREDIT_SCORE":"720","DEBT":"10000"}'
```

**2. API Key (recommended for services)**
```bash
# Include in X-API-Key header
curl -H "X-API-Key: YOUR_API_KEY" \
     -X POST http://localhost:3050/api/run/main \
     -H "Content-Type: application/json" \
     -d '{"AGE":"30","INCOME":"50000","CREDIT_SCORE":"720","DEBT":"10000"}'
```

### Example Response
```json
{
    "program": "main",
    "success": true,
    "duration": 14,
    "stdout": "FINAL STATUS: APPROVED (PRIME)",
    "timestamp": "2026-02-22T10:30:00.000Z"
}
```

###  Performance Demos

Run the included demo scripts:
```bash
# High-frequency flood test (1000 concurrent requests)
node tests/performance/hft_flood.js

# Logic topology visualization
node tests/performance/topology_mapper.js

# System dashboard
node tests/performance/master_dashboard.js
```

---

## 🏗️ Architecture Stack

This is a true **full-stack legacy modernization** environment:

| Layer | Component | Function |
|-------|-----------|----------|
| **Logic Layer** | `GnuCOBOL 3.1` | Compiles and executes `main.cob` business rules. |
| **Neural Bridge** | `Node.js` | Intercepts stdio, connects to AI, exposes HTTP API. |
| **Knowledge Graph** | `PostgreSQL` | Stores transaction history and logic metadata. |
| **Cortex Memory** | `Redis` | Caches AI explanations for sub-millisecond recall. |
| **Orchestrator** | `Docker Compose` | Manages the segregated service mesh. |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Copyright © 2026 Ricky Anh Nguyen, OrchesityAI & Kolerr Lab**

Open source and contributions welcome!

---

## 🤝 Contributing

We welcome contributions from the community! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Make your changes following our coding standards
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
7. Push to your fork: `git push origin feat/amazing-feature`
8. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 🔒 Security

Found a security vulnerability? Please see our [Security Policy](SECURITY.md) for responsible disclosure guidelines.

---

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/Kolerr-Lab/sentineli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Kolerr-Lab/sentineli/discussions)
- **Email**: ricky@orchesity.ai
- **Documentation**: [Full Documentation](docs/)

---

## 🙏 Acknowledgments

Built with ❤️ by **Ricky Anh Nguyen**

Special thanks to:
- GnuCOBOL Team for the excellent COBOL compiler
- OpenAI for GPT-4o API
- The mainframe community for decades of COBOL expertise
- All contributors who help improve this project

---

**Sentineli** - *Making legacy systems intelligent, one COBOL program at a time*

**Built with ❤️ for the Mainframe Community**

# Supacron 🤖⚡️

**AI-Native Pooled Trading Protocol on Cronos EVM**

Supacron is a decentralized trading protocol that enables pooled capital management driven by an autonomous AI agent. It pioneers the **"Pay-to-Compute"** model using the **X402 Protocol**, ensuring that high-value AI execution is economically gated and sustainable.

By combining off-chain AI intelligence with on-chain risk governance, Supacron creates a trustable environment where **Takers** (upside seekers) and **Absorbers** (yield earners) can co-invest with transparency.

---

## 🌟 Key Features

### 1. 🧠 AI Trading Agent
*   **Autonomous Execution:** The AI agent analyzes market sentiment, price action, and technical indicators to execute trades on Crypto.com Futures.
*   **Pay-to-Compute (X402):** Access to the AI's compute resources is gated via the **X402 Protocol** (HTTP 402 Payment Required). Operators must cryptographically sign payment authorizations (EIP-712) to trigger AI inference and execution.
*   **Dynamic Bias:** The AI adjusts its bias (Bullish/Bearish/Neutral) and position sizing based on real-time market conditions.

### 2. 🛡️ On-Chain Risk Governance
*   **Smart Contract Safety:** All capital is held in Cronos EVM smart contracts.
*   **Circuit Breakers:** Automated mechanisms pause trading or limit exposure if daily drawdowns exceed defined thresholds (e.g., 5%).
*   **Waterfalls:** Profit and loss distribution is strictly defined by smart contract logic, prioritizing Absorber capital protection (first-loss buffer provided by Takers).

### 3. 👥 Dual User Roles
*   **Takers:** Users seeking higher volatility and potential upside. They take on more risk in exchange for a larger share of trading profits.
*   **Absorbers:** Users seeking stable yield. They provide liquidity that acts as a buffer, earning a "protected yield" from the pool's operations.

### 4. 📊 Real-Time Transparency
*   **Live Dashboard:** View real-time pool TVL, PnL, and position status.
*   **Activity Logs:** Every AI decision and trade execution is logged on-chain and indexed (via Supabase) for full auditability.
*   **Governance:** Community-driven parameter updates (e.g., risk budgets, fee splits) via on-chain proposals.

---

## 🏗️ Architecture

The project follows a hybrid architecture:

*   **Frontend:** Next.js 15 (App Router), Tailwind CSS, Shadcn/UI, Framer Motion.
*   **Smart Contracts:** Solidity contracts deployed on **Cronos Testnet**.
*   **Backend / Database:** Supabase (PostgreSQL) for indexing off-chain activity and AI logs.
*   **AI Engine:** OpenAI (reasoning) + Crypto.com Exchange API (execution).
*   **Economic Layer:** X402 Protocol (for monetizing AI compute).

### Directory Structure

```
src/
├── app/
│   ├── api/             # Next.js API Routes (AI Agent, Admin)
│   ├── governance/      # Governance dashboard & proposals
│   ├── pool/            # Main pool dashboard (Taker/Absorber view)
│   ├── pool-admin/      # Admin interface for Operator (X402 gated)
│   └── portfolio/       # User portfolio & position management
├── components/          # Reusable UI components (Shadcn/UI)
├── lib/
│   ├── smart-contract/  # ABI and contract addresses
│   ├── x402.ts          # X402 Protocol implementation (Payment Headers)
│   └── pool-activity.ts # Supabase activity logging
└── styles/              # Global styles
```

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   npm / yarn / pnpm
*   MetaMask (configured for Cronos Testnet)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/supacron.git
    cd supacron
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

    # Crypto.com API (for AI Agent)
    CRYPTOCOM_API_KEY=your_api_key
    CRYPTOCOM_API_SECRET=your_api_secret
    CRYPTOCOM_API_URL=https://uat-api.crypto.com/v2/

    # OpenAI (Optional, for reasoning)
    OPENAI_API_KEY=your_openai_key
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔗 Smart Contract (Cronos Testnet)

| Contract | Address |
| :--- | :--- |
| **Supacron Pool** | `0xCC5...` (See `src/lib/smart-contract/supa.ts`) |

**Network Details:**
*   **Chain Name:** Cronos Testnet
*   **RPC URL:** `https://evm-t3.cronos.org`
*   **Chain ID:** `338` (0x152)
*   **Currency Symbol:** `tCRO`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the Cronos AI Hackathon*

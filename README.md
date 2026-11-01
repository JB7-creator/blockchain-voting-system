# DeVote — Decentralized Blockchain Voting System 🗳️

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**DeVote** is a secure, tamper-proof, and fully transparent decentralized voting system deployed on Ethereum. Built to replace opaque election mechanisms, DeVote guarantees that every vote is cryptographically authenticated, immutable on-chain, and publicly verifiable in real-time.

---

## 🌟 Key Features

- **Decentralized & Tamper-Proof**: Election results cannot be modified or censored by any central entity once cast.
- **Strict Access Control**:
  - **Admin**: Election commissioner can set election details, add candidates, and open/close voting phases.
  - **Voters**: Whitelisted / verified voter registration preventing Sybil attacks.
- **Double-Voting Prevention**: Smart contract guarantees each unique Ethereum address can cast exactly one vote:
  ```solidity
  require(!hasVoted[msg.sender], "You have already voted");
  ```
- **Real-Time Verifiable Tally**: Immediate vote count updates emitted via EVM events (`event Voted(...)`).
- **Modern Responsive Web3 UI**: Developed with React and styled with Tailwind CSS (`devote-ui`).
- **Multi-Network Support**: Ready for local development (Hardhat Network Chain ID: 31337) and Ethereum Sepolia Testnet.

---

## 🏗️ System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │          React Web3 Frontend            │
                       │               (devote-ui)               │
                       └────────────────────┬────────────────────┘
                                            │
                                            │ ethers.js / MetaMask
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │       Ethereum / Hardhat Network        │
                       │      ┌───────────────────────────┐      │
                       │      │      Voting.sol           │      │
                       │      │  ├─ Election Lifecycle   │      │
                       │      │  ├─ Voter Whitelist       │      │
                       │      │  ├─ Candidate Management  │      │
                       │      │  └─ Immutable Tally       │      │
                       │      └───────────────────────────┘      │
                       └─────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
Blockchain-voting-system/
├── contracts/
│   └── voting.sol           # Core Solidity election contract
├── scripts/
│   └── deploy.js            # Hardhat contract deployment automation
├── test/
│   └── Voting.test.js       # Comprehensive Chai/Mocha test suite
├── devote-ui/               # React & Tailwind Web3 frontend
│   ├── src/
│   │   ├── App.js           # Web3 connector & voting dashboard
│   │   └── App.css
│   └── package.json
├── hardhat.config.js        # Hardhat configuration (local & Sepolia)
├── package.json             # Root dev dependencies & scripts
├── .env.example             # Environment variables template
└── .gitignore               # Ignored secrets, build, and node_modules
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+ recommended)
- [MetaMask](https://metamask.io/) browser extension

### 2. Clone the Repository
```bash
git clone https://github.com/JB7-creator/Blockchain-voting-system.git
cd Blockchain-voting-system
```

### 3. Install Smart Contract Dependencies
```bash
npm install
```

### 4. Run the Hardhat Local Blockchain
Start a local Ethereum node with 20 pre-funded test accounts:
```bash
npx hardhat node
```
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`

### 5. Deploy Contract to Local Node
In a separate terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Note the printed contract address (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`).

---

## 💻 Running the Frontend (`devote-ui`)

1. Navigate to the frontend directory:
   ```bash
   cd devote-ui
   npm install
   ```

2. Make sure the deployed contract address matches `CONTRACT_ADDRESS` inside `devote-ui/src/App.js`.

3. Start the application:
   ```bash
   npm start
   ```
   The UI will launch at `http://localhost:3000`.

4. Connect your MetaMask wallet to the **Hardhat Local** network (`http://127.0.0.1:8545`, Chain ID `31337`).

---

## 🧪 Testing

Run the full smart contract test suite:
```bash
npx hardhat test
```

---

## 🌐 Deploying to Ethereum Sepolia Testnet

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and `ETHERSCAN_API_KEY`.
3. Deploy to Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

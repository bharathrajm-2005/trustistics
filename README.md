# Trustistics — Decentralized Cold-Chain Provenance & Tamper Detection Platform

Trustistics is an enterprise cold-chain monitoring, provenance verification, and tamper-detection system designed for sensitive pharmaceutical and perishable logistics (such as vaccines, biologics, and donor organs). 

It combines **Ethereum smart contracts**, an **automated IoT telemetry simulator**, **OpenWeather-informed risk forecasting**, and a **role-based React dashboard** to enforce end-to-end auditability and trust across the supply chain.

---

## 📌 Why This Project Exists

1. **The Cold-Chain Vulnerability**: Temperature-sensitive medical products spoil rapidly if temperature deviations occur during transit. In traditional logistics, temperature logs are often recorded on proprietary paper or closed systems, making them vulnerable to manual tampering or omitted records.
2. **Custody & Handoff Blindspots**: Multiple independent parties handle a shipment (Suppliers, Drivers, Customs Inspectors, Warehouses, Delivery Partners). Disputes frequently arise regarding who possessed the container when temperature thresholds were breached or seals were compromised.
3. **Cryptographic Proof & Accountability**: Trustistics anchors every critical milestone—shipment initialization, document uploads, custody handoffs, customs clearances, and temperature breach alerts—to an immutable blockchain ledger via cryptographic hashes (`bytes32 dataHash`). Any post-facto modification in the database is immediately flagged by the tamper detection engine.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Edge["Edge / Physical Layer"]
        IoT["IoT Sensors / GPS (iot_simulator.py)"]
        QR["QR Code Scanners (html5-qrcode)"]
    end

    subgraph Frontend["Frontend Layer (React 19 + Vite)"]
        UI["Role-Based Portals: Supplier | Driver | Warehouse | Customs | Customer"]
        PublicVerify["Public Trust Page (/verify/:shipmentId)"]
    end

    subgraph Backend["API Layer (FastAPI)"]
        API["FastAPI REST Endpoints"]
        RiskEngine["Real-Time Risk & Weather Assessment"]
        VerificationEngine["Tamper Detection & Custody Validator"]
    end

    subgraph Storage["Storage & Ledger"]
        MongoDB[("MongoDB (coldchain db)")]
        Blockchain[("Hardhat EVM (ColdChainProvenance.sol)")]
    end

    IoT -->|POST /api/tracking/:id/temperature| API
    QR -->|Scan Verification URL| PublicVerify
    UI <-->|HTTP / JSON| API
    PublicVerify <-->|HTTP / JSON| API

    API <-->|Shipment & Telemetry Records| MongoDB
    API -->|anchorEvent(shipmentId, eventType, dataHash)| Blockchain
    VerificationEngine -->|verifyHash(shipmentId, dataHash)| Blockchain
```

---

## 🚀 Key Features

- **Immutable Milestone Anchoring**: Every critical event (creation, dispatch, handoff, customs, temperature breach) produces a SHA-256 hash stored on-chain in `ColdChainProvenance.sol`.
- **Automated IoT Sensor Simulation**: `iot_simulator.py` simulates real-time temperature fluctuations, battery drain, GPS waypoints, and injected temperature breaches along routes.
- **Dynamic Weather & Route Risk Scoring**: Ingests route forecasts to alert logistics operators of temperature risks prior to dispatch.
- **Custody Chain Tracking**: Digital sign-offs during physical handoffs between drivers, customs, and warehouse managers.
- **One-Click Public QR Verification**: Every shipment generates a unique QR code. End users (hospitals, doctors, patients) can scan the QR code to inspect complete provenance, temperature graphs, custody logs, and blockchain audit stamps without logging in.
- **Automated Tamper Detection**: Compares database records against blockchain-anchored hashes to expose tampered telemetry, altered documents, or unauthorized modifications.

---

## 👥 User Roles & Access

The web interface includes simulated role-based access. Log in with any email/password and select your role:

| Role | Access URL | Capabilities |
| :--- | :--- | :--- |
| **Supplier** | `/supplier` | Create shipments, upload documents, live tracking, timeline inspection, analytics, tamper detection. |
| **Driver** | `/driver` | View assigned route manifests, log GPS checkpoints, and execute custody handoffs. |
| **Warehouse Manager** | `/warehouse` | Manage shipment intake, inspection logs, and storage conditions. |
| **Customs Officer** | `/customs` | Record import/export customs clearance, flag inspections, and sign approvals. |
| **Customer / Recipient** | `/verify/:shipmentId` | Public view to audit temperature history, chain of custody, and smart contract verification. |

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity `^0.8.20`, Hardhat, Ethers.js
- **Backend**: Python 3.10+, FastAPI, Uvicorn, PyMongo, Web3.py, Pydantic, Passlib, Bcrypt, HTTPX
- **Database**: MongoDB (`coldchain`)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Three.js, html5-qrcode, qrcode.react

---

## 📋 Prerequisites

Before running the project, ensure you have:
1. **Node.js** (v18.x or v20.x+) & **npm**
2. **Python** (v3.10+ or v3.13+)
3. **MongoDB** running locally on port `27017` (or a cloud MongoDB Atlas connection URI)

---

## ⚡ Step-by-Step Setup & Run Commands

Open separate PowerShell / terminal tabs for each service from the project root directory:

### 1️⃣ Terminal 1: Blockchain Layer (Hardhat)

```powershell
# Navigate to blockchain directory and install dependencies
cd blockchain
npm install

# Start local Hardhat Ethereum node (keep this running)
npm run node
```

In a separate one-off terminal tab, deploy the smart contract to the running node:
```powershell
cd blockchain
npm run deploy
```
> **Note**: `npm run deploy` outputs the contract address and automatically writes `CONTRACT_ADDRESS` into `backend/.env`.

---

### 2️⃣ Terminal 2: Backend API (FastAPI)

1. Make sure your local MongoDB service is running (or set your MongoDB Atlas URI in `backend/.env`).
2. Run the following:

```powershell
# Navigate to project root
cd C:\Users\LENOVO\trustistics

# Create and activate virtual environment (if not already created)
python -m venv backend\venv
.\backend\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt

# Start the FastAPI server on all interfaces
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 3️⃣ Terminal 3: Frontend Web App (React + Vite)

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host
```

- **Web Dashboard**: [http://localhost:5173](http://localhost:5173) (or access via your local LAN IP displayed in terminal).

---

### 4️⃣ Terminal 4: IoT Sensor Telemetry Simulator (Optional / Testing)

Once a shipment has been created in the dashboard:

```powershell
# Run simulator from workspace root
python iot_simulator.py <SHIPMENT_ID> [OPTIONAL_BASE_TEMPERATURE]

# Example:
python iot_simulator.py SHP-9372 -20
```
The simulator will push real-time GPS locations and temperature updates every 30 seconds along a predefined transit route, deliberately triggering a breach event at milestone 3 (Bhopal) for testing alert pipelines and blockchain anchoring.

---

## 🔒 Verification & Tamper Detection Workflow

1. **Create Shipment**: Enter product details, temperature limits, and origin/destination on `/supplier/create`.
2. **Download & Attach QR**: Print or display the generated QR code which links to `${origin}/verify/${shipment_id}`.
3. **Simulate Movement**: Start `python iot_simulator.py <SHIPMENT_ID>`. Watch the live telemetry and temperature charts update in `/supplier/tracking`.
4. **Audit on Chain**: Open `/supplier/tamper` to run a cryptographic integrity check between MongoDB and the Ethereum smart contract.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

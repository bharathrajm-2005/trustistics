<div align="center">

# ❄️ Trustistics
### **Decentralized Cold-Chain Provenance & Tamper-Detection Platform**

*Cryptographic auditability, real-time IoT telemetry, and predictive route risk intelligence for temperature-critical pharmaceutical and perishable logistics.*

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Ethereum](https://img.shields.io/badge/EVM_Hardhat-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)](https://hardhat.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

[Overview](#-why-trustistics-exists) • [Architecture](#-system-architecture) • [Core Capabilities](#-core-capabilities) • [Role Portals](#-role-based-portals) • [Quick Start](#-step-by-step-setup--run-commands) • [Verification Flow](#-end-to-end-verification-workflow)

</div>

---

## 🎯 Why Trustistics Exists

Temperature-sensitive medical shipments—such as **vaccines, biologics, insulin, and donor organs**—can lose efficacy or spoil completely within minutes of a thermal excursion. Traditional supply chains rely on fragmented, siloed logging systems that leave critical gaps in accountability.

| 🚨 The Industry Challenge | 🛡️ The Trustistics Solution |
| :--- | :--- |
| **Mutable & Siloed Logs**<br>Paper records and centralized databases can be altered or selectively omitted after a spoilage event occurs. | **On-Chain Cryptographic Anchoring**<br>Every critical milestone and telemetry checkpoint is hashed (`SHA-256` / `bytes32`) and anchored to an immutable Ethereum smart contract. |
| **Custody & Handoff Blindspots**<br>Shipments pass through suppliers, drivers, customs, and warehouses—creating disputes over *who* held custody during a breach. | **Verifiable Chain-of-Custody**<br>Cryptographically signed handoffs bind every physical transfer to an authenticated role and timestamp. |
| **Reactive Breach Discovery**<br>Thermal excursions are often discovered only after delivery, when life-saving cargo is already ruined. | **Live IoT Telemetry + Predictive Weather Risk**<br>Real-time sensor streams and OpenWeather-informed route risk scoring flag hazards before and during transit. |
| **Opaque Verification for Recipients**<br>Hospitals and clinics lack an instant, trustless way to audit a shipment's cold-chain history upon arrival. | **Zero-Login Public QR Passport**<br>A single QR scan reveals the full temperature timeline, custody trail, and live blockchain hash verification. |

---

## 🏛️ System Architecture

Trustistics bridges physical edge telemetry with off-chain high-throughput storage (**MongoDB**) and on-chain cryptographic truth (**Hardhat EVM**).

```mermaid
flowchart TD
    subgraph Edge["📡 Edge & Physical Layer"]
        IoT["🌡️ IoT Sensors & GPS<br/>(iot_simulator.py)"]
        QR["📱 QR Code Scanners<br/>(html5-qrcode)"]
    end

    subgraph Frontend["🖥️ Frontend Layer (React 19 + Vite)"]
        UI["🔐 Role-Based Portals<br/>Supplier | Driver | Warehouse | Customs"]
        PublicVerify["🌐 Public Trust Passport<br/>(/verify/:shipmentId)"]
    end

    subgraph Backend["⚙️ API & Intelligence Layer (FastAPI)"]
        API["🚀 FastAPI REST Gateway"]
        RiskEngine["🌦️ Weather & Route Risk Engine"]
        VerificationEngine["🛡️ Tamper Detection & Custody Validator"]
    end

    subgraph Storage["🗄️ Persistence & Immutable Ledger"]
        MongoDB[("🍃 MongoDB<br/>(coldchain database)")]
        Blockchain[("⛓️ Hardhat EVM<br/>(ColdChainProvenance.sol)")]
    end

    IoT -->|"POST /api/tracking/:id/temperature"| API
    QR -->|"Scan Verification URL"| PublicVerify
    UI <-->|"HTTP / JSON"| API
    PublicVerify <-->|"HTTP / JSON"|
# Real-Time Crypto Fraud Attribution System

## Problem Statement ID
26183

## Organization
Ministry of Home Affairs — Indian Cyber Crime Coordination Centre (I4C), CIS Division

## Category
Software

## Theme
Blockchain & Cybersecurity

---

# 1. Project Overview

The **Real-Time Crypto Fraud Attribution System** is a blockchain intelligence and investigation platform designed to help law-enforcement agencies analyze cryptocurrency wallet addresses reported by cybercrime victims.

In many cyber-fraud cases, victims are instructed to transfer cryptocurrency to wallet addresses controlled by fraudsters or intermediaries.

These addresses may belong to:

- Fraudsters
- Burner wallets
- Non-custodial wallets
- Intermediary wallets
- Layering wallets
- Money-mule wallets
- DeFi-related addresses
- Addresses eventually controlled by cryptocurrency exchanges/VASPs

The major challenge is that a wallet address by itself does not reveal the identity of its owner.

Therefore, the system must analyze the **transaction history and movement of funds** to determine:

1. Where the reported funds came from.
2. Where the funds went.
3. Which wallets were involved.
4. Whether intermediary wallets were used.
5. Whether funds crossed blockchain networks.
6. Whether funds eventually reached a known exchange/VASP.
7. How suspicious the movement pattern is.
8. What actionable intelligence can be provided to an investigator.

---

# 2. Core Objective

The primary objective is:

> **Convert a victim-reported cryptocurrency wallet address into actionable blockchain intelligence.**

### Input

A wallet address reported through a cybercrime complaint.

Example:

```text
0x1234...abcd
```

### Processing

```text
Wallet Address
      ↓
Blockchain Identification
      ↓
Transaction Retrieval
      ↓
Transaction Normalization
      ↓
Transaction Graph Construction
      ↓
Fund Flow Analysis
      ↓
Wallet Clustering
      ↓
Known Entity/VASP Matching
      ↓
Risk & Pattern Analysis
      ↓
Cross-Chain Analysis
      ↓
Investigation Intelligence
```

### Output

The investigator should receive:

- Suspect wallet profile
- Transaction history
- Fund-flow graph
- Related wallets
- Intermediary wallets
- Known exchange/VASP exposure
- Cross-chain movements
- Suspicious transaction patterns
- Risk score
- Evidence timeline
- Investigation recommendations
- Standardized investigation report

---

# 3. Important Engineering Principle

The system must **not claim that a wallet belongs to a particular person merely because funds reached an exchange**.

Blockchain analysis provides evidence and attribution signals, not automatic legal identity.

Therefore, the system should distinguish between:

### Observed Fact

```text
Wallet A sent 2.4 ETH to Wallet B.
```

### Known Blockchain Entity

```text
Wallet B matches a known exchange deposit address.
```

### Analytical Inference

```text
Wallet A appears to be indirectly connected to Exchange X
through Wallet B and Wallet C.
```

### Confidence

```text
Attribution Confidence: 87%
```

This distinction is important for investigative integrity and evidence preservation.

---

# 4. Supported Investigation Workflow

## Step 1 — Victim Wallet Submission

An investigator enters or imports a reported wallet address.

Possible input:

```text
Wallet Address
Blockchain
Case ID
Complaint ID
Reported Amount
Reported Date
Fraud Type
Victim Reference
```

Example:

```text
Case ID: NCRP-XXXX
Wallet: 0x123...
Chain: Ethereum
Amount: 2.5 ETH
Fraud Type: Investment Fraud
Reported Date: 2026-08-20
```

---

# 5. Blockchain Data Collection

The system retrieves blockchain information associated with the wallet.

Required information may include:

- Transactions
- Block numbers
- Timestamps
- Sender addresses
- Receiver addresses
- Transaction values
- Transaction fees
- Transaction hashes
- Token transfers
- Smart-contract interactions
- Internal transactions where available
- Contract addresses
- Gas information
- Chain identifiers

The architecture should be designed to support multiple blockchain ecosystems.

Potential initial chains:

- Ethereum
- BNB Smart Chain
- Polygon
- Bitcoin
- Tron
- Solana

Additional chains can be added through adapters/indexers.

---

# 6. Transaction Normalization

Different blockchains represent transactions differently.

The platform should convert blockchain-specific data into a common internal format.

Example normalized transaction:

```json
{
  "chain": "ethereum",
  "tx_hash": "0x...",
  "timestamp": "2026-08-20T10:30:00Z",
  "from": "0xAAA...",
  "to": "0xBBB...",
  "asset": "ETH",
  "amount": 2.5,
  "fee": 0.002,
  "block_number": 12345678,
  "transaction_type": "TRANSFER"
}
```

This allows the same analytics engine to operate across multiple blockchains.

---

# 7. Transaction Graph

The central data structure of the system is a **transaction graph**.

Represent:

```text
Wallet = Node
Transaction = Edge
```

Example:

```text
Victim Wallet
      |
      | 2.5 ETH
      ↓
Suspect Wallet A
      |
      | 2.3 ETH
      ↓
Intermediary Wallet B
      |
      | 2.1 ETH
      ↓
Intermediary Wallet C
      |
      ↓
Known Exchange Deposit Address
      |
      ↓
Exchange
```

The graph should support:

- Incoming transactions
- Outgoing transactions
- Token transfers
- Multiple hops
- Time-based filtering
- Amount filtering
- Address relationships
- Entity labels
- Cross-chain links

---

# 8. Fund Flow Tracing

The system should automatically trace funds from the reported wallet.

Example:

```text
Reported Wallet
       ↓
Hop 1
       ↓
Hop 2
       ↓
Hop 3
       ↓
Exchange / VASP
```

Investigators should be able to select:

```text
Trace Depth:
1 hop
2 hops
3 hops
5 hops
10 hops
```

The system should prevent uncontrolled graph expansion by using:

- Maximum hop depth
- Maximum transaction count
- Time window
- Minimum transaction value
- Chain filters
- Address-type filters

---

# 9. VASP / Exchange Identification

One of the most important features is identifying whether funds reach a known:

- Cryptocurrency exchange
- VASP
- Custodial wallet
- Broker
- Payment service
- Other known blockchain entity

The platform should maintain an **Entity Intelligence Database**.

Example:

```text
Address
    ↓
Address Label
    ↓
Entity
    ↓
Entity Type
    ↓
Source
    ↓
Confidence
```

Each label should store:

```text
Address
Entity
Entity Type
Blockchain
Source
Confidence
Last Verified
```

The system should distinguish:

- Exchange hot wallets
- Deposit addresses
- Withdrawal addresses
- Cold wallets
- Service wallets
- Known infrastructure addresses

---

# 10. Wallet Clustering

A single organization may control thousands or millions of addresses.

Therefore, the system should support wallet clustering.

Possible clustering signals include:

- Common transaction patterns
- Shared funding sources
- Repeated interaction patterns
- Known entity relationships
- Deposit-address relationships
- Temporal behavior
- Common counterparties

Clustering results must be represented as:

```text
Cluster ID
Cluster Members
Cluster Type
Evidence
Confidence
```

The system should avoid presenting heuristic clustering as confirmed ownership.

---

# 11. Intermediary Wallet Detection

Fraudsters may move funds through multiple wallets before reaching a service.

The system should identify potential intermediary wallets.

Example:

```text
Fraud Wallet
     ↓
Layering Wallet 1
     ↓
Layering Wallet 2
     ↓
Layering Wallet 3
     ↓
Exchange
```

Potential indicators:

- Short holding periods
- Rapid forwarding of funds
- High percentage of incoming funds subsequently transferred
- Similar transaction amounts
- Multiple upstream/downstream relationships
- Repeated forwarding behavior

The system should classify such addresses as:

```text
Potential Intermediary
```

rather than automatically declaring them laundering wallets.

---

# 12. Cross-Chain Analysis

Fraud proceeds may move between blockchains.

Example:

```text
Ethereum
    ↓
Bridge
    ↓
BNB Smart Chain
    ↓
DEX
    ↓
Tron
    ↓
Exchange
```

The system should detect possible cross-chain movement through:

- Bridges
- Known cross-chain services
- Asset conversions
- Corresponding transaction timing
- Known bridge contracts
- Destination-chain addresses where traceable

Cross-chain relationships should be represented in the investigation graph.

---

# 13. DeFi Analysis

The system should identify interactions with decentralized protocols.

Potential protocol categories:

- DEX
- Lending protocol
- Bridge
- Staking protocol
- Token swap contract
- Smart contract
- Other DeFi infrastructure

Example:

```text
Suspect Wallet
      ↓
DEX Contract
      ↓
USDT
      ↓
New Wallet
```

The system should decode known smart-contract interactions where possible.

---

# 14. Mixer / Tumbling Detection

The platform should identify interaction with known privacy-enhancing or mixing services where reliable labels are available.

Example:

```text
Suspect Wallet
      ↓
Known Mixer Contract
      ↓
Unknown Wallet
```

The system should classify this as:

```text
Mixer Exposure
```

Interaction with a mixer alone must not be treated as proof of criminal activity.

---

# 15. Fraud Pattern Detection

The platform should support automated detection of transaction patterns associated with fraud investigations.

### Rapid Fund Movement

```text
Receive funds
    ↓
Immediately transfer funds
```

### Layering

```text
A → B → C → D → Exchange
```

### Fund Splitting

```text
A
├── B
├── C
├── D
└── E
```

### Fund Consolidation

```text
A ─┐
B ─┤
C ─┼──→ D
E ─┘
```

### Exchange Funnel

```text
Multiple wallets
       ↓
Known Exchange
```

### Cross-Chain Movement

```text
Chain A
   ↓
Bridge
   ↓
Chain B
```

---

# 16. Risk Scoring

Each wallet should receive an analytical risk score.

Example:

```text
Risk Score: 82 / 100
Risk Level: HIGH
```

The score should be based on explainable signals.

Example:

```text
+20 Known suspicious entity exposure
+15 Mixer interaction
+15 Rapid fund movement
+10 Multiple intermediary hops
+10 Cross-chain movement
+12 High-risk transaction pattern
----------------------------------
  82 Risk Score
```

The exact scoring model should be configurable.

The system should display **why** the wallet received a particular score.

---

# 17. AI / ML Layer

Machine learning should be used as an assistance layer rather than replacing investigator judgment.

Possible ML tasks:

### Classification

```text
Input:
Transaction Features

Output:
Risk Category
```

Possible categories:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Anomaly Detection

Identify unusual transaction behavior.

### Pattern Recognition

Detect known fraud typologies.

### Graph Analysis

Identify important nodes and relationships.

### Ranking

Rank connected wallets based on investigative relevance.

---

# 18. Explainable AI

Every AI-generated recommendation should contain supporting signals.

Bad:

```text
Wallet is fraudulent.
```

Good:

```text
High-risk behavior detected.

Reasons:
- 87% of received funds were forwarded within 15 minutes.
- Wallet interacted with 4 intermediary wallets.
- Funds subsequently reached a known VASP deposit cluster.
- Cross-chain transfer detected.
- Similar transaction pattern observed in known high-risk cases.

Confidence: 89%
```

---

# 19. Real-Time Alerting

The platform should generate alerts when important events occur.

Examples:

- Funds moved from suspect wallet
- Funds reached exchange
- Large transaction detected
- Cross-chain transfer detected
- Mixer interaction detected
- New intermediary discovered
- Previously unknown wallet cluster discovered

Example:

```text
ALERT

Case: NCRP-XXXX

Reported wallet has transferred funds
to a wallet associated with a known VASP.

Severity: HIGH
```

---

# 20. Investigator Dashboard

The dashboard should provide a complete investigation view.

### Case Information

```text
Case ID
Complaint ID
Fraud Type
Reported Amount
Reported Date
```

### Wallet Summary

```text
Wallet Address
Chain
Balance
First Seen
Last Active
Risk Score
```

### Transaction Summary

```text
Incoming Transactions
Outgoing Transactions
Total Volume
Unique Counterparties
```

### Entity Exposure

```text
Exchange Exposure
VASP Exposure
DeFi Exposure
Bridge Exposure
Mixer Exposure
```

### Fund Flow Graph

Interactive visualization:

```text
Wallet → Wallet → Wallet → Exchange
```

### Risk Analysis

Display:

```text
Risk Score
Risk Factors
Detected Patterns
Confidence
```

---

# 21. Investigation Timeline

Every important blockchain event should be displayed chronologically.

Example:

```text
10:31 AM
Victim → Suspect Wallet
2.5 ETH

10:36 AM
Suspect → Wallet B
2.4 ETH

10:40 AM
Wallet B → Wallet C
2.35 ETH

11:05 AM
Wallet C → Exchange Deposit Address
2.3 ETH
```

---

# 22. Data Sources

The platform should separate data into multiple categories.

## A. Public Blockchain Data

Examples:

- Block data
- Transactions
- Token transfers
- Smart-contract interactions
- Addresses
- Transaction timestamps
- Transaction values

Possible sources include:

- Blockchain RPC nodes
- Blockchain explorers/APIs
- Public indexing APIs
- Self-hosted blockchain nodes
- Blockchain indexing infrastructure

---

## B. Entity / VASP Intelligence Data

Possible sources:

- Publicly available exchange wallet labels
- Verified blockchain intelligence datasets
- Official VASP information
- Investigator-maintained address lists
- Law-enforcement-provided intelligence
- Trusted blockchain analytics providers

Each label should store:

```text
Address
Entity
Entity Type
Blockchain
Source
Confidence
Last Verified
```

---

## C. Cybercrime Complaint Data

Potential input from:

- NCRP
- SAHYOG
- LEA case-management systems
- Investigator uploads
- Authorized APIs

Example:

```text
Complaint ID
Wallet Address
Fraud Type
Reported Amount
Date
Chain
Case ID
```

These integrations must be implemented only through authorized interfaces.

---

## D. Threat Intelligence

Potential information:

- Known scam wallets
- Previously investigated addresses
- Sanctioned addresses
- Known malicious contracts
- Reported fraud addresses
- Known mixer/service addresses
- Previously identified clusters

---

# 23. Data Architecture

Recommended architecture:

```text
                 ┌──────────────────────┐
                 │ NCRP / SAHYOG / LEA  │
                 └──────────┬───────────┘
                            │
                            ↓
                 ┌──────────────────────┐
                 │ Case Intake Service  │
                 └──────────┬───────────┘
                            │
                            ↓
                 ┌──────────────────────┐
                 │ Blockchain Data      │
                 │ Acquisition Layer    │
                 └──────────┬───────────┘
                            │
                            ↓
                 ┌──────────────────────┐
                 │ Data Normalization   │
                 └──────────┬───────────┘
                            │
                            ↓
                 ┌──────────────────────┐
                 │ Blockchain Index     │
                 └──────────┬───────────┘
                            │
             ┌──────────────┼───────────────┐
             ↓              ↓               ↓
       Graph Engine    Entity Engine    Pattern Engine
             │              │               │
             └──────────────┼───────────────┘
                            ↓
                 ┌──────────────────────┐
                 │ Risk / ML Engine     │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ Intelligence Engine  │
                 └──────────┬───────────┘
                            ↓
                 ┌──────────────────────┐
                 │ Investigator Portal  │
                 └──────────────────────┘
```

---

# 24. Recommended Technical Architecture

## Frontend

Possible technologies:

- React
- TypeScript
- Tailwind CSS
- Chart.js
- D3.js
- Cytoscape.js / React Flow

## Backend

Possible technologies:

- Python
- FastAPI
- PostgreSQL
- Redis
- Celery / background workers

## Blockchain Layer

Use chain-specific adapters:

```text
Blockchain Adapter
├── Ethereum
├── BSC
├── Polygon
├── Bitcoin
├── Tron
└── Solana
```

Each adapter converts blockchain-specific data into the common transaction schema.

---

# 25. Storage Architecture

A relational database can store:

```text
Cases
Wallets
Transactions
Entities
Risk Scores
Alerts
Reports
```

A graph database can store:

```text
Wallet → Wallet
Wallet → Entity
Wallet → Contract
Wallet → Bridge
Wallet → Exchange
```

Possible technologies:

- PostgreSQL
- Neo4j
- Elasticsearch / OpenSearch
- Redis
- Object storage

The initial prototype may use PostgreSQL plus graph structures in the application before introducing a dedicated graph database.

---

# 26. Core Database Entities

Recommended entities:

```text
Case
Wallet
Transaction
TokenTransfer
Entity
EntityLabel
WalletCluster
RiskAssessment
Alert
InvestigationEvent
CrossChainEvent
Protocol
Report
User
AuditLog
```

---

# 27. Example Investigation

Suppose an investigator receives:

```text
Reported Wallet:

0xAAA...
```

The system automatically discovers:

```text
0xAAA...
   ↓
0xBBB...
   ↓
0xCCC...
   ↓
Bridge Contract
   ↓
BNB Chain
   ↓
0xDDD...
   ↓
Known VASP Deposit Address
```

The dashboard should display:

```text
Risk Level: HIGH

Fund Flow:
0xAAA → 0xBBB → 0xCCC → Bridge → 0xDDD → VASP

Detected Patterns:
✓ Rapid fund forwarding
✓ Multiple intermediary wallets
✓ Cross-chain movement
✓ VASP exposure

Attribution Confidence:
High

Recommended Action:
Review VASP exposure and preserve transaction evidence.
```

Recommendations should be presented as investigative intelligence, not automatic legal conclusions.

---

# 28. Investigation Report

The platform should generate a standardized report containing:

```text
Case Information
↓
Reported Wallet
↓
Blockchain
↓
Transaction Summary
↓
Fund Flow
↓
Related Wallets
↓
Entity/VASP Exposure
↓
Cross-Chain Activity
↓
Detected Patterns
↓
Risk Assessment
↓
Evidence References
↓
Investigator Recommendations
```

Each transaction should retain:

```text
Transaction Hash
Block Number
Timestamp
Blockchain
From
To
Asset
Amount
```

so that the underlying evidence can be independently verified.

---

# 29. Security Requirements

Because the system is intended for law-enforcement use, security is critical.

The platform should implement:

- Role-based access control
- Strong authentication
- API authentication
- Encryption in transit
- Encryption at rest
- Audit logs
- Case-level authorization
- Data access logging
- Secure secret management
- Rate limiting
- Input validation
- API monitoring
- Evidence integrity mechanisms

Sensitive investigation information must not be exposed publicly.

---

# 30. Evidence Integrity

The platform should preserve evidence in a reproducible manner.

For every important analytical result, retain:

```text
Source
Timestamp
Transaction Hash
Blockchain
Analysis Method
Data Version
Confidence
Analyst/System
```

Where appropriate, reports can include cryptographic hashes of exported evidence packages to detect later modification.

---

# 31. Performance Requirements

The system should minimize the time between wallet submission and initial intelligence generation.

The architecture should support:

```text
Fast initial analysis
        +
Background deep analysis
```

Example:

```text
0–5 seconds
Basic wallet information

5–30 seconds
Recent transactions + entity matching

Background
Deep graph tracing
Cross-chain analysis
ML analysis
Historical clustering
```

Exact latency targets should be established during implementation based on selected blockchain data providers.

---

# 32. Scalability

The architecture should support:

```text
1 case
↓
100 cases
↓
10,000 cases
↓
Millions of transactions
```

Blockchain ingestion and analytics should therefore be asynchronous and horizontally scalable.

Recommended architecture:

```text
API
 ↓
Message Queue
 ↓
Workers
 ↓
Blockchain Index
 ↓
Analytics Engine
 ↓
Database
```

---

# 33. API-First Design

Example APIs:

```http
POST /api/cases
POST /api/wallets/analyze
GET  /api/wallets/{address}
GET  /api/wallets/{address}/transactions
GET  /api/wallets/{address}/graph
GET  /api/wallets/{address}/risk
GET  /api/cases/{case_id}
POST /api/reports
GET  /api/alerts
```

External integrations should be authenticated and authorized.

---

# 34. MVP Scope

For the hackathon prototype, do **not** attempt to build the entire production-grade system.

The MVP should focus on proving the core value proposition.

### MVP Pipeline

```text
Wallet Input
     ↓
Blockchain Selection
     ↓
Transaction Retrieval
     ↓
Transaction Graph
     ↓
Known Entity Matching
     ↓
Fund Flow Tracing
     ↓
Risk Scoring
     ↓
Interactive Dashboard
     ↓
Investigation Report
```

### Recommended MVP Chains

Start with:

```text
Ethereum
BNB Smart Chain
```

Then demonstrate how the architecture can support additional chains.

---

# 35. MVP Features

The first working version should implement:

1. **Wallet Investigation** — Input a wallet address.
2. **Transaction Analysis** — Retrieve and normalize transactions.
3. **Graph Visualization** — Display wallet-to-wallet relationships.
4. **Exchange/VASP Matching** — Compare addresses against a known-label dataset.
5. **Fund Tracing** — Trace funds for configurable hop depth.
6. **Risk Score** — Generate explainable risk indicators.
7. **Timeline** — Show chronological fund movement.
8. **Dashboard** — Provide investigator-friendly analytics.
9. **Report Generation** — Generate a structured investigation report.

---

# 36. Future Features

After MVP:

- NCRP integration
- SAHYOG integration
- More blockchain networks
- Real-time streaming
- Advanced graph algorithms
- Graph neural networks
- Automated wallet clustering
- Advanced cross-chain tracing
- Advanced entity resolution
- Threat-intelligence integration
- Investigator collaboration
- Case management
- Automated VASP notification workflows
- Large-scale blockchain indexing
- Evidence package generation

---

# 37. Important Data Governance Rule

The system should classify information into:

### Raw Blockchain Data

Directly retrieved from blockchain infrastructure.

### Enriched Data

Generated by combining blockchain information with known labels.

### Analytical Data

Generated by algorithms or ML models.

### Investigator Input

Information entered by authorized investigators.

These categories should not be mixed without recording their origin.

---

# 38. Core Principle for AI Coding Agents

When implementing this project, always think in terms of:

```text
DATA
 ↓
NORMALIZATION
 ↓
GRAPH
 ↓
ENTITY RESOLUTION
 ↓
PATTERN DETECTION
 ↓
RISK ANALYSIS
 ↓
INTELLIGENCE
 ↓
INVESTIGATOR ACTION
```

Do not build the application as a simple blockchain explorer.

The primary product is an **investigative intelligence system**.

---

# 39. Definition of Success

The prototype is successful if an investigator can:

1. Enter a victim-reported wallet address.
2. Select the blockchain.
3. Retrieve its transaction history.
4. Visualize fund movement.
5. Identify connected/intermediary wallets.
6. Detect suspicious transaction patterns.
7. Identify a known exchange/VASP when evidence supports the association.
8. Understand the path taken by the funds.
9. See an explainable risk assessment.
10. Generate a standardized investigation report.

The most important metric is:

> **How quickly can the system transform a raw wallet address into useful, evidence-backed investigative intelligence?**

---

# 40. Project Vision

The long-term vision is to create a scalable blockchain intelligence platform for authorized law-enforcement investigations that reduces manual blockchain tracing effort and helps investigators respond faster to cryptocurrency-enabled cybercrime.

The system should combine:

```text
Blockchain Data
+
Graph Analytics
+
Entity Intelligence
+
Cross-Chain Analysis
+
AI/ML
+
Threat Intelligence
+
Case Management
+
Investigator Visualization
```

to create a unified **Real-Time Crypto Fraud Attribution and Investigation Platform**.

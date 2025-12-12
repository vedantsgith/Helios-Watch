# Brownie Challenge Project

This folder contains a standalone Brownie project with a simple `SecureVault` smart contract, deployment scripts, and unit tests. It’s isolated from your frontend/backend and can be developed independently.

## Prerequisites (Windows)
- Python 3.9+ installed and on PATH
- Install Brownie: `pip install eth-brownie`
  - Brownie will auto-install a suitable `solc` compiler via `py-solc-x` on first compile.

## Quick Start
```bash
# From the workspace root
cd brownie1

# Compile contracts
brownie compile

# Run unit tests
brownie test

# Deploy to local development network
brownie run scripts/deploy.py --network development
```

## Project Structure
- `contracts/` — Solidity source (`SecureVault.sol`)
- `scripts/` — Brownie scripts (`deploy.py`, `interact.py`)
- `tests/` — Pytest-based Brownie tests
- `brownie-config.yaml` — Compiler/network config

## SecureVault Overview
- Deposit ETH and withdraw safely with a simple non-reentrancy guard.
- Emits `Deposited` and `Withdrawn` events for transparency.
- Per-account balances tracked on-chain.

## Notes
- For non-default Python environments, prefer: `python -m pip install eth-brownie`.
- If `solc` install prompts occur, Brownie will download automatically.

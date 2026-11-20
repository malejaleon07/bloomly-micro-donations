# Bloomly

**Small acts. Real impact.**

Bloomly is a community micro-donation app for the UBC 2026 Blockchain Hackathon. Neighbors share a small need, a demo reviewer approves it, and donors can send test USDC on Arc Testnet.

Live demo on this computer: [http://bloomly.localhost:5173](http://bloomly.localhost:5173)

Repository: [github.com/malejaleon07/bloomly-micro-donations](https://github.com/malejaleon07/bloomly-micro-donations)

## What it does

- Browse labeled sample campaigns on **Make an Impact**
- Start a request in four steps: story, expenses, verification, review
- Load a category with one click and attach a sample document for the demo
- Keep identity checks as **Demo verification — Pending review.** Applicants cannot approve themselves
- Let a demo reviewer approve, reject, or request more information
- Show a campaign publicly only after that approval
- Donate Arc Testnet USDC with MetaMask, then record only transfers whose receipt matches the donor, recipient, and amount

Test USDC has no real monetary value. Bloomly does not collect government IDs, and uploaded file contents are not saved.

## Try the demo

```bash
npm install
npm run dev
```

Open [http://bloomly.localhost:5173](http://bloomly.localhost:5173). `http://localhost:5173` also works.

1. Choose **Start a request**.
2. Click a category, such as Food & Groceries. Bloomly fills a fictional story, expenses, and a sample document.
3. Under **Where should your donations go?**, paste a demo address:
   `0x1111111111111111111111111111111111111111`
4. Submit for review. The request stays off Make an Impact.
5. Open **Reviewer demo**, then choose **Approve**.
6. Return to **Make an Impact**. Only the approved request is newly public.

To send a test donation, install MetaMask, switch to Arc Testnet, and get test USDC from the [Circle faucet](https://faucet.circle.com/). Use a wallet you control if you want to receive the test funds. The demo address above is only for filling the form.

```bash
npm run build
npm run preview
node tests/verification-flow.mjs
```

## Built with

- React, TypeScript, Vite, Tailwind CSS
- React Router
- viem
- MetaMask
- Arc Testnet USDC

## Arc Testnet

| Item | Value |
|------|--------|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.io` |
| Explorer | `https://explorer.testnet.arc.io` |
| USDC ERC-20 | `0x3600000000000000000000000000000000000000` (6 decimals) |
| Faucet | [faucet.circle.com](https://faucet.circle.com/) |

Sources: [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc), [RPC endpoints](https://docs.arc.io/arc/references/rpc-endpoints), [Contract addresses](https://docs.arc.io/arc/references/contract-addresses), [Circle USDC](https://developers.circle.com/stablecoins/usdc-contract-addresses).

On Arc, USDC is also the native gas token (18 decimals). Bloomly sends donations through the ERC-20 interface. The mempool requires `maxFeePerGas` of at least 20 Gwei.

## Demo limits

- Maximum request: **$1,500**
- One open request at a time in this browser
- Review and identity status are a hackathon simulation
- Campaigns, accounts, and donations in progress are stored in this browser
- No card payments, bank payouts, or real identity documents

## Project layout

```
src/
  components/   Logo, layout, campaign cards, donation panel
  pages/        Home, Make an Impact, request, reviewer, account
  data/         Labeled sample campaigns
  lib/          Storage, validation, Arc USDC transfers
  config/arc.ts Official Arc Testnet constants
tests/          Request, review, and donation-gate checks
```

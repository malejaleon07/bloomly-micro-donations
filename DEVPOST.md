# Devpost copy

Paste these into the Bloomly submission. The public repo is https://github.com/malejaleon07/bloomly-micro-donations.

## Project name

Bloomly

## Tagline

Small acts. Real impact.

## Built with

React, TypeScript, Vite, Tailwind CSS, React Router, viem, MetaMask, Arc Testnet, USDC

## About the project

Bloomly helps a neighbor ask for a small, specific need — groceries, rent, baby essentials, utilities, or a transit pass — and lets someone nearby answer with a small Arc Testnet USDC gift.

A request is not public until a demo reviewer approves it. The applicant sees **Demo verification — Pending review** and can attach a sample document, but cannot choose their own verification result. Donations open only for an approved campaign with a valid wallet address. Bloomly counts a donation after the Arc receipt matches the donor, recipient, and amount.

This hackathon build uses test USDC, which has no real monetary value. It does not collect government IDs or store uploaded file contents.

## Inspiration

Small help is easier to offer when the need is specific and the amount is modest. Bloomly is a warm place to share that kind of need, with a clear review step before a campaign can accept test donations.

## What it does

- Shows labeled sample campaigns on Make an Impact
- Lets someone click a category and load a fictional request plus a sample document
- Requires a valid Arc Testnet address before test donations can be accepted
- Keeps pending requests private until the reviewer approves, rejects, or asks for more information
- Sends test USDC from MetaMask on Arc Testnet and links the confirmed transaction

## How to run it

```bash
npm install
npm run dev
```

Open http://bloomly.localhost:5173

Demo wallet for the request form: `0x1111111111111111111111111111111111111111`

Then open Reviewer demo and approve the request. It appears on Make an Impact only after approval.

## How we built it

The interface is React, TypeScript, Vite, and Tailwind. Wallet connection and USDC transfers use viem against Arc Testnet chain `5042002`. Campaigns and review decisions are stored in the browser so judges can run the full flow without a backend. Automated checks flag incomplete requests for a person to review. They never approve or reject a request on their own.

## Challenges

Arc uses USDC both as gas and as the ERC-20 donors transfer. Bloomly uses the ERC-20 interface at 6 decimals and sets a fee high enough for the Arc mempool. The review flow also had to ignore any approval flag typed into the request form, so a campaign cannot publish itself.

## Accomplishments

Judges can click a category, submit fictional proof, approve it from the reviewer screen, and see it appear publicly. An approved campaign can then receive a verified Arc Testnet USDC transfer.

## What's next

A production version would use an approved identity provider, store real review decisions on a server, and send funds only to a wallet the recipient controls. This demo keeps those steps simulated and labeled.

## Try it out

http://bloomly.localhost:5173

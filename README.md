# Volts: cash flow app for an electrical services company (demo)

A mobile-first bookkeeping app I built for a small business of independent electricians. It gives the partners one place to record income, capture expenses, issue quotes and see their real margin.

> **Demo copy.** This is a sanitized public copy of a client app. The client's name, branding and data were removed, and all records are fictional demo data.

## Features
- **Income:** one-tap quick entries for common jobs, plus a daily earnings history with Excel export
- **Expenses:** photograph a receipt and the AI reads and classifies the amount (Gemini)
- **Cash flow:** total income, expenses, net balance, and receivables from issued quotes
- **Quotes:** create quotes, export them to PDF, and track paid vs. pending
- **Sync:** optional Google Drive backup

## Stack
React · TypeScript · Vite · Tailwind CSS · Express · Gemini API (receipt classification) · Firebase · jsPDF

Built with Google AI Studio.

## Run locally
```bash
npm install
cp .env.example .env.local   # add a GEMINI_API_KEY for receipt scanning
npm run dev
```
The app starts with fictional demo data stored in the browser (localStorage). For Google Drive sync, replace the placeholder values in `firebase-applet-config.json` with your own Firebase project.

---
Joel Semrik, Licensed Public Accountant · [LinkedIn](https://linkedin.com/in/joelsemrik)

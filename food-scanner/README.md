# 🥕 SafeBite – Food Scanner

A Yuka-style food scanner that runs on any phone as an installable web app (PWA).

## Features

| Feature | How it works |
|---|---|
| **Barcode scanning** | Phone camera via the native `BarcodeDetector` API, with a ZXing fallback for other browsers. You can also type a barcode. |
| **Ingredients & harmful-ingredient flags** | Product data comes from [Open Food Facts](https://world.openfoodfacts.org) (3M+ products, 150+ countries). Ingredients are checked against a curated database (`src/data/additives.ts`) built from IARC, EFSA, FDA, WHO, JECFA and EU/California regulations. Each flag shows its risk level and its sources. |
| **Score out of 100** | 60% nutrition (Nutri-Score), 30% additives, 10% organic. A high-risk ingredient caps the score below 50. |
| **Health benefits** | Calories, fat, saturated fat, sugars, salt, fibre and protein, rated with UK FSA traffic-light thresholds and EU claim rules. Vitamins and minerals are shown as a % of the EU daily reference value. |
| **Safer alternatives** | Products in the same category that score higher and contain no high-risk ingredients. |
| **Call out the brand** | Opens a pre-written email in the user's mail app, with the brand's address in **To**, listing each flagged ingredient and its sources. The user only reviews it and presses send. |
| **Search** | Every product you scan is saved on the device (the knowledge base grows with use). You can search it offline, and also search Open Food Facts online. |
| **FDA recalls** | Shows recent openFDA food recall reports for the brand. |

## Brand email addresses

The **To** address is filled in from:
1. Addresses the user entered earlier for that brand (saved on the device), then
2. the shared directory in `src/data/brandContacts.ts`.

The shared directory starts empty on purpose. Add only addresses you have verified on each brand's official website. If a brand isn't known yet, the dialog links to a web search for its contact email. After the user enters an address once, it is pre-filled for every product from that brand.

## Development

```bash
cd food-scanner
npm install
npm run dev       # http://localhost:5173
npm test          # unit tests (scoring, flags, email, search)
npm run build     # static site in dist/
```

The camera only works over **HTTPS** (or localhost). `dist/` is a static site, so you can host it on GitHub Pages, Netlify, Vercel or a similar host. On a phone, use "Add to Home Screen" to install it like an app.

## Disclaimer

SafeBite is for information only and is not medical advice. Risk ratings summarise public research and regulatory positions, which change over time.

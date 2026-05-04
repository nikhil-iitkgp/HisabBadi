# HisabBadi

HisabBadi is a stateless, mobile-first receipt generator for mandi / grain transactions.
It lets shopkeepers enter transaction details, add weights dynamically, and instantly generate a clean print-ready receipt.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- No database (fully client-side calculation flow)

## Features

- Form fields: date, buyer, seller, grain, rate/kg, reduction/bori, palledari/bori
- Weight input UX:
  - Dynamic rows (`+ Add Row`, remove row)
  - Optional space-separated quick paste
- Receipt sections:
  - Basic info
  - Bori/reduction/palledari
  - Compact multi-line weights
  - Formula-based calculations
  - Highlighted final payment
- Bilingual labels: English + Hinglish
- Print/PDF support through browser print (`window.print()`)

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build (Static Export)

```bash
npm run build
```

The exported static site is generated in the `out/` folder.

## Render Deployment (Static Site)

Create a **Static Site** on Render and configure:

- Build Command: `npm install && npm run build`
- Publish Directory: `out`
- Node Version: `>=20`

No environment variables are required for the current stateless version.

## Project Structure

```
/app
	page.tsx
/components
	Form.tsx
	Receipt.tsx
	WeightInput.tsx
	Button.tsx
/utils
	calculations.ts
	types.ts
/styles
	globals.css
```

---
name: lemonaid-standards
description: Lemonaid's product, design, data, and quality rules. Use for every build iteration on the Lemonaid web app, including any change to index.html, styles.css, app.js, or the NHTSA data features.
---

# Lemonaid standards

Lemonaid helps used-car and first-time buyers check a specific car before they buy it. Follow every rule below in every change, no matter who is asking.

## The one job

A buyer enters a VIN (or picks year, make, and model) and gets a plain-English report built from live public data: what the car is, its safety recalls, the problems owners report most, and a checklist to take to the test drive.

- Every change must make that job work better. Do not add unrelated features such as price estimates, loan calculators, logins, or chatbots.
- Results must come from the live NHTSA data for the vehicle the user chose. Never ship hard-coded or "example" results. Fixed reference content (checklist wording, seller questions, how-to tips) is fine.

## Technical rules (GitHub Pages)

- Plain HTML, CSS, and JavaScript only. No React, Vite, npm packages, or any build step. The files in the repo are exactly what the browser runs.
- File layout, all names lowercase:
  - `index.html`: page structure only
  - `styles.css`: all styles
  - `app.js`: all logic
  - `api-test.html`: NHTSA connection check (keep it; do not delete)
- Link files with relative paths (`styles.css`, not `/styles.css`), because the site is served from a subfolder.
- No API keys, passwords, accounts, servers, or paid services. No real personal information in code, sample data, or prompts.
- Never run git commands. The team saves work with GitHub Desktop.
- Keep the code readable: short functions with clear names, plus a comment above each section explaining what it does.

## Data rules

Use only these free NHTSA endpoints, called with `fetch()` from the browser:

| Purpose | Endpoint |
| --- | --- |
| Decode a VIN | `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}?format=json` |
| List makes | `https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json` |
| Models for a make and year | `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/{make}/modelyear/{year}?format=json` |
| Model names the recall data uses | `https://api.nhtsa.gov/products/vehicle/models?modelYear={year}&make={make}&issueType=r` |
| Recalls | `https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}` |
| Owner complaints | `https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}` |

- URL-encode every value you put into a URL.
- Every request shows a loading state, has a 15-second timeout, and shows a friendly message with a "Try again" button if it fails.
- **Never mix up "none found" and "couldn't check."** If a request fails, or the model name may not match NHTSA's records, say so plainly. Never show "0 recalls" or "No complaints" unless the request succeeded for a model name NHTSA recognizes.
- The recall data lists recalls for the model, not whether this specific car was repaired. Always also link to `https://www.nhtsa.gov/recalls` so the buyer can check the exact VIN.
- A VIN is 17 characters and never contains I, O, or Q. Check the format before calling the API. If the decode returns a nonzero `ErrorCode`, show NHTSA's `ErrorText` in plain words, and still show whatever details it did decode.
- Show "Data: NHTSA public datasets (vPIC, Recalls, Complaints)" and the time it was fetched on every report and printout.
- Translate jargon into buyer terms. For example, a recall component of "AIR BAGS" becomes "Air bags: may not protect you in a crash." Keep NHTSA's original wording available in a "Details" expander.

## Design rules (keep the existing Lemonaid look)

- Font: `"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif`.
- Brand yellow ramp. Use these values; do not invent new brand colors.
  - Brand fill (primary buttons, logo tile, active nav): `#FFB900`, hover `#E0A200`, pressed `#B88400`
  - Text and icons on yellow are always dark `#241A00`, never white
  - Brand text and links on light backgrounds: `#8F6600`. In dark mode: `#FFCA42`
  - Soft brand tint (icon tiles, hero area): `#FFF9EF` light, `#312300` dark
- Neutrals (light / dark): app bar and nav `#F0F0F0` / `#0A0A0A`, content area `#FAFAFA` / `#1F1F1F`, cards `#FFFFFF` / `#292929`, text `#242424` / `#FFFFFF`, secondary text `#616161` / `#ADADAD`, borders `#E0E0E0` / `#3D3D3D`.
- Status: good `#0E700E`, warning `#BC4B09`, serious `#B10E1C`. Always pair a color with an icon or word, never color alone.
- Layout: a top app bar (48px) with the Lemonaid lemon logo, a "Prototype" badge, an About button, and a light/dark toggle. On screens 1024px and wider, show a left nav (260px). Below that, show a menu button that opens the nav as an overlay. Content sits on rounded cards (8px radius, soft shadow), max width 1200px. Grids collapse to one column below 640px.
- Keep the existing pages and names: Home, Report overview, Things to check, Pre-purchase checklist, Safety recalls, Seller and costs.
- Keep the existing features working: the checklist with progress bar and reset, the per-issue notes, Copy questions, Print report (print-only layout), Recently viewed, and the dark mode toggle saved in localStorage.
- Tone: calm, supportive, plain English, written for someone who has never bought a car. Do not use scare words. Always recommend an independent mechanic's inspection.

## Accessibility

- Every input has a visible label. Every icon-only button has an `aria-label`.
- Visible focus outline on everything you can tab to. All actions work with the keyboard.
- Text contrast is at least 4.5:1 in both themes.
- Respect `prefers-reduced-motion`.
- Tap targets are at least 44px tall on phones.

## Before you finish any iteration

Check all of these, and say in your final message which ones you checked:

1. The page works at 375px wide and on a desktop, in both light and dark mode.
2. There are no errors in the browser console.
3. Every button, link, and nav item does something real. Nothing is left as a placeholder.
4. It was tested with a real VIN, an invalid VIN (too short, or containing an O), a car with many recalls, and a car with none.
5. Turning the network off shows the friendly error, not a blank screen or "0 recalls".
6. No API keys, personal data, or files with uppercase names were added.
7. `docs/build-log.md` has a new entry: date, who led the iteration, what changed, and why.

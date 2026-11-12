# Lemonaid build plan (5 members)

**One job:** a buyer enters a VIN (or year, make, and model) and gets a plain-English report from live NHTSA data: what the car is, its recalls, the problems owners report most, and a checklist for the test drive.

## Every iteration, every member

1. In GitHub Desktop, click **Fetch origin**, then **Pull** if it's offered.
2. Open the repo folder in Antigravity. Start your prompt with `/lemonaid-standards`.
3. Screenshot the prompt, the agent's plan, and the result. These go in the build log.
4. Open the live site on your phone and laptop and run the skill's "Before you finish" checklist.
5. In GitHub Desktop, write a clear summary, then **Commit** and **Push**. Never ask the agent to do git.
6. Tell the team in the group chat that you've pushed, so the next person can start.

Only one person builds at a time. Changes to the same file made at the same time cause merge conflicts.

---

## Iteration 0: setup (Member 1, about 30 minutes)

- Create the public repo in GitHub Desktop and add teammates under Settings → Collaborators.
- Add the current `index.html`, `api-test.html`, `.agents/skills/lemonaid-standards/SKILL.md`, and the `docs/` folder. Commit and push.
- Turn on GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`.
- Open `https://<user>.github.io/<repo>/api-test.html` on a laptop **and** a phone. Screenshot the results.
  - **If all five checks pass**, follow the plan below.
  - **If any fail**, stop and tell the team before anyone builds on that data source.

## Iteration 1: rebuild as editable files and use live dropdowns (Member 1)

Why: the current `index.html` is a 768 KB compiled React bundle. Neither people nor the agent can realistically edit it, and every year, make, and model in it is hard-coded.

> /lemonaid-standards Rebuild Lemonaid as plain `index.html`, `styles.css`, and `app.js`, keeping the current design, pages, and features described in the skill (checklist with progress and reset, per-issue notes, Copy questions, Print report, Recently viewed, dark mode toggle). Replace the hard-coded make/model lists with live NHTSA data: load makes from vPIC, and load models when the user picks a make and year. Keep the old file as `old-prototype.html` for reference, and don't link to it from the app.

Done when: the site looks like before, any real year, make, and model can be chosen, and every page still works.

## Iteration 2: VIN lookup (Member 2)

> /lemonaid-standards Add a VIN search to the Home page as the main way to start: a 17-character input with format checking (no I, O, or Q), and a "Look up" button that decodes the VIN with vPIC and opens the Report overview. Add a "Vehicle details" card to the overview with year, make, model, trim, body style, engine, fuel type, drive type, and where it was built, each with a one-line plain-English explanation. Keep year/make/model dropdowns as a "Don't have the VIN?" option. Add 3 "Try a sample VIN" buttons that run the real lookup.

Sample VINs: find 3 real VINs from public sources (such as manufacturer or NHTSA example documentation) and confirm each one decodes on https://vpic.nhtsa.dot.gov/decoder/ before you add it. Don't use a VIN from someone's personal car.

## Iteration 3: live safety recalls (Member 3)

> /lemonaid-standards Make the Safety recalls page and the overview's recalls card show live recalls for the selected vehicle. Show one card per recall with a plain-English title, risk, and remedy, and NHTSA's own wording in a Details expander. Match the model name against NHTSA's recall model list first. If it doesn't match, let the user pick the right model. Never show "0 recalls" when the lookup failed or the model didn't match. Keep the link to nhtsa.gov/recalls to check whether this specific VIN was repaired.

Test with a vehicle that has many recalls, one with none, and one whose model name is tricky (such as `F-150`).

## Iteration 4: owner complaints replace the "example concerns" (Member 4)

> /lemonaid-standards Replace the generic "Example concerns" and the "Things to check" content with real data: fetch owner complaints for the selected vehicle, group them by component, and show the top 5 problem areas with counts, a plain-English description of what to look and listen for, and whether any involved crashes, fires, or injuries. Keep the notes box on each problem area. Remove the "demonstration data" banners and replace them with the NHTSA source line and a reminder to get an independent inspection.

**Run user testing right after this iteration** (see below). Everyone should be free to help.

## Iteration 5: changes from user testing, tailored checklist, and print (Member 5)

> /lemonaid-standards Make these changes from our user testing: [paste the top findings]. Also tailor the pre-purchase checklist to the decoded vehicle: add items based on fuel type (hybrid/EV battery checks, diesel), drive type (AWD/4WD), and the top complaint areas and open recalls. Update Print report to include the vehicle details, recalls, and top complaint areas.

Done when: at least one change visibly comes from what a tester did. Note it in the build log with before and after screenshots.

---

## User testing (everyone, between iterations 4 and 5)

- Each member recruits 1 or 2 people from the target group (a first-time or used-car buyer, or someone shopping soon). Aim for 5 or more total. The minimum is 3.
- Give them only the link and one task: "You're thinking about buying this car: [VIN]. Is it a safe buy, and what should you check?"
- Watch without helping. Write down where they hesitate, what they tap that doesn't do what they expect, and what they say out loud.
- Ask afterwards: "What was confusing?" and "What would you want this to tell you that it didn't?"
- Don't record names or personal details. Use "Tester A", "Tester B", and so on.

## Final checks before submitting

- [ ] The live link works on a phone and a laptop with no console errors.
- [ ] `api-test.html` still passes.
- [ ] No hard-coded results, demo banners, or placeholder buttons are left.
- [ ] `.agents/skills/lemonaid-standards/SKILL.md` exists, and screenshots show each of the 5 members using it.
- [ ] `docs/build-log.md` has an entry for every iteration.
- [ ] The report says the data is public (NHTSA vPIC, Recalls, and Complaints APIs) and that no personal data is used.
- [ ] Testing notes are in the report, showing 3 or more testers and at least one change made because of them.
- [ ] There are no API keys or passwords anywhere in the repo.

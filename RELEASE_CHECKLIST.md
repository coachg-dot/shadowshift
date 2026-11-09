# Shadowshift v1.0 release checklist

This document separates automated checks from testing that requires a physical device. Do not mark v1.0 fully verified until both categories pass.

## Automated GitHub Actions

- [ ] The latest **Shadowshift smoke tests** workflow on `main` is green.
- [ ] Node smoke test passes for 18 floors, navigation routes, monsters, rewards, seasonal challenges, and corrupted saves.
- [ ] Headless Chromium tests pass at 1280×800 desktop and 390×844 / 320×700 mobile emulation.
- [ ] WebKit (Safari engine) browser tests pass at 390×844 and 320×700 iPhone-sized viewports.
- [ ] Save/reload and new-tab tests preserve Floor 2, rewards, and backup recovery.
- [ ] Download the `shadowshift-browser-screenshots` artifact and inspect both screen sizes.
- [ ] No browser page errors or failed assertions.

GitHub Actions: https://github.com/coachg-dot/shadowshift/actions

## Physical iPhone Safari (primary release target)

Open https://coachg-dot.github.io/shadowshift/ in a normal browser (not private mode).

- [ ] Text and buttons are readable without horizontal scrolling.
- [ ] All four movement buttons respond, including quick changes and two-finger touch.
- [ ] INTERACT opens a power-cell challenge near a terminal.
- [ ] A wrong answer does not spend coins or complete the terminal; a correct answer does.
- [ ] Opening the math question or Safe Room freezes monster movement.
- [ ] Completing all three terminals unlocks the exit.
- [ ] Finishing the floor advances to Floor 2.
- [x] Closing and reopening Safari resumes at Floor 2 (confirmed by player on physical iPhone). Coins and skins retention still need a separate check.
- [ ] Lock iPhone / switch apps, return to Safari, and verify Floor 2 remains saved.
- [ ] Export a backup from Progress and verify it downloads to the iPhone Files app.
- [x] Floor 10 boss splash and boss encounter display correctly (player-tested; reward still to verify).
- [ ] Floor 10 boss awards bonus coins and the Sentinel Slayer skin.
- [ ] Floor 20 Professor Plus-a-Saurus reveal, three math seals, and reward.
- [ ] Floor 30 Multiplying Munchosaur reveal, three math seals, and reward.
- [ ] Floor 40 Great Calculord reveal, hardest questions, champion ending, and saved ending after reopening.
- [ ] Effects LOW mode remains selected after reopening and is smoother on slower phones.
- [ ] Shop, Locker, and Progress open and return to the game.
- [ ] Try portrait and landscape; report clipped or unreachable controls.

## Release decision

**Pass:** Latest CI is green, screenshots look correct, and a real phone completes a full floor without blockers.

**Hold:** Progress is lost, controls are stuck, math or floor progression is blocked, the page crashes, or critical buttons cannot be reached.

## Known limitations

- Progress is stored in each browser's local storage; it does **not** automatically sync between phone and Chromebook.
- Clearing browser/site data or using private browsing may remove progress.
- WebKit and Chromium emulation do not substitute for testing on a physical iPhone.
- A prior Chrome session restarted at Floor 1; physical iPhone Safari successfully resumed at Floor 2. Chrome-specific storage persistence remains unverified.

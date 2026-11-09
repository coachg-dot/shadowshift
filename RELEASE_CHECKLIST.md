# Shadowshift v1.0 release checklist

This document separates automated checks from testing that requires a physical device. Do not mark v1.0 fully verified until both categories pass.

## Automated GitHub Actions

- [ ] The latest **Shadowshift smoke tests** workflow on `main` is green.
- [ ] Node smoke test passes for 18 floors, navigation routes, monsters, rewards, seasonal challenges, and corrupted saves.
- [ ] Headless Chromium tests pass at 1280×800 desktop and 390×844 mobile emulation.
- [ ] Download the `shadowshift-browser-screenshots` artifact and inspect both screen sizes.
- [ ] No browser page errors or failed assertions.

GitHub Actions: https://github.com/coachg-dot/shadowshift/actions

## Physical phone (Android or iPhone)

Open https://coachg-dot.github.io/shadowshift/ in a normal browser (not private mode).

- [ ] Text and buttons are readable without horizontal scrolling.
- [ ] All four movement buttons respond, including quick changes and two-finger touch.
- [ ] INTERACT opens a power-cell challenge near a terminal.
- [ ] A wrong answer does not spend coins or complete the terminal; a correct answer does.
- [ ] Opening the math question or Safe Room freezes monster movement.
- [ ] Completing all three terminals unlocks the exit.
- [ ] Finishing the floor advances to Floor 2.
- [ ] Closing and reopening the browser preserves coins, skins, and floor progress.
- [ ] Effects LOW mode remains selected after reopening and is smoother on slower phones.
- [ ] Shop, Locker, and Progress open and return to the game.
- [ ] Try portrait and landscape; report clipped or unreachable controls.

## Release decision

**Pass:** Latest CI is green, screenshots look correct, and a real phone completes a full floor without blockers.

**Hold:** Progress is lost, controls are stuck, math or floor progression is blocked, the page crashes, or critical buttons cannot be reached.

## Known limitations

- Progress is stored in each browser's local storage; it does **not** automatically sync between phone and Chromebook.
- Clearing browser/site data or using private browsing may remove progress.
- Phone emulation in Chromium is not a substitute for testing on a physical device.

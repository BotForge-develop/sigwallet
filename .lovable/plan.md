
Goal: make the auth screen feel anchored on iPhone so opening the keyboard does not cause the whole page to “jump” or become finger-draggable.

What I found
- The current auth screen still changes layout when the keyboard opens:
  - `src/pages/Auth.tsx` toggles `keyboardVisible` and changes spacing/scale (`mb-6 scale-90 opacity-90` vs `mb-12 mt-auto`).
  - The page uses a flex column with `mt-auto` / `mb-auto`, so when the keyboard state changes the whole composition reflows.
- The app shell is only `relative min-h-[100dvh]` in `src/App.tsx`, not locked to the physical viewport.
- `src/index.css` sets `min-height: 100%` on `html, body, #root`, which still allows viewport resizing/elastic behavior instead of fully pinning the app.
- Capacitor keyboard config is already set to no native resize, so the remaining issue is mostly web layout strategy, not plugin setup.

Implementation plan
1. Lock the app shell to a fixed viewport
- Update the top-level app container in `src/App.tsx` to use a fixed, non-scrolling frame (`fixed inset-0`, width cap, overflow hidden).
- Center the phone-sized app inside that fixed frame so the webview itself does not visually move.

2. Replace the auth page’s flex-reflow layout with an anchored layout
- Refactor `src/pages/Auth.tsx` from “content pushed by auto margins” to a fixed three-zone structure:
  - top brand/header area
  - middle form area
  - bottom spacer/safe-area area
- Keep the form anchored vertically with explicit top padding instead of `mt-auto`/`mb-auto`.
- Remove the layout-changing logo shrink/reflow as the primary keyboard response.

3. Handle keyboard with a transform, not reflow
- Keep the page height constant.
- When the keyboard opens, move only the auth content wrapper slightly upward with `transform: translateY(...)` and a smooth transition.
- Use a bounded offset so it feels stable and always returns to the exact same resting point.
- Prefer reading keyboard height from the Capacitor keyboard event if available, rather than a simple boolean.

4. Prevent manual dragging / rubber-band feel inside the auth screen
- Add stricter non-scroll behavior on the auth route container:
  - `overflow-hidden`
  - `touch-action: manipulation` or equivalent safe mobile behavior
  - optional `overscroll-behavior-y: none` on root app containers
- Update `html, body, #root` in `src/index.css` to use full fixed height (`height: 100%` / `100dvh`) rather than only `min-height`.

5. Keep inputs usable without moving the whole app
- Ensure the form section has enough reserved vertical space so email/password fields stay visible above the keyboard.
- If needed, reduce only decorative spacing on keyboard open, not structural layout.
- Keep the submit button reachable without introducing page scroll.

6. Native-focused QA after implementation
- Test specifically on iPhone build:
  - tap email
  - tap password
  - switch between fields
  - dismiss keyboard
  - rotate if relevant
- Verify there is no:
  - whole-screen jump
  - draggable offset after keyboard opens
  - stuck translated state after keyboard closes

Files to update
- `src/pages/Auth.tsx`
- `src/App.tsx`
- `src/index.css`

Expected result
- The auth screen will have one fixed resting position.
- Opening the keyboard will no longer re-layout the whole page.
- At most, the centered auth block will glide upward slightly, then return exactly to the same point when the keyboard closes.
- The screen should no longer feel like it can be manually “rearranged” after keyboard interaction.

Technical details
```text
Current issue:
[viewport]
  [auth flex layout with auto margins]
  -> keyboardVisible toggles classes
  -> layout recalculates
  -> content appears to jump/drift

Planned behavior:
[fixed app frame]
  [anchored auth wrapper]
    [header]
    [form]
  -> keyboard event updates offset only
  -> transformY(-N px)
  -> no document/page reflow
```

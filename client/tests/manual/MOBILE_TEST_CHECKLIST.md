# Mobile Testing Checklist - KROG Chess

## Test Devices

### Required (Minimum):
- [ ] iPhone SE (375px - smallest modern iPhone)
- [ ] iPhone 14 Pro (393px)
- [ ] Samsung Galaxy S8 (360px)
- [ ] Samsung Galaxy A51 (412px)
- [ ] iPad (768px)

### Optional (Recommended):
- [ ] Galaxy Z Fold 5 (344px folded)
- [ ] Pixel 5 (393px)
- [ ] iPad Pro (1024px)

---

## Module 1: Responsive Layout

### Board Sizing
- [ ] Board fits screen width on all devices
- [ ] Board is perfectly square (width = height)
- [ ] No horizontal scrolling
- [ ] Board resizes on orientation change
- [ ] Minimum board size: 280px
- [ ] Maximum mobile board size: 480px

### Layout
- [ ] Single column on mobile (<768px)
- [ ] Two column on tablet (768-1023px)
- [ ] Full layout on desktop (1024px+)

---

## Module 2: Mobile Navigation

### Visibility
- [ ] Nav appears on mobile (<768px)
- [ ] Nav hidden on tablet/desktop (>=768px)
- [ ] Nav fixed to bottom of screen
- [ ] Nav doesn't overlap content

### Functionality
- [ ] All 5 tabs visible and tappable
- [ ] Active tab highlighted in green
- [ ] Tapping tab changes active state
- [ ] Icons and labels clearly visible
- [ ] Smooth color transitions

### Content Padding
- [ ] Main content has bottom padding
- [ ] Content not hidden behind nav
- [ ] Padding removed on desktop

---

## Module 3: Touch-Optimized Board

### Piece Selection
- [ ] Tap piece shows green border
- [ ] Legal moves show as green dots
- [ ] Tap same piece deselects
- [ ] Tap different piece switches selection

### Piece Movement
- [ ] Tap legal square executes move
- [ ] Tap illegal square shows red flash
- [ ] Move animation is smooth
- [ ] No accidental zooming on double-tap

### Visual Feedback
- [ ] Selected square clearly highlighted
- [ ] Last move highlighted
- [ ] Check indicator works (red glow)
- [ ] Invalid move feedback clear

---

## Module 4: Bottom Sheets

### Mobile Bottom Sheets
- [ ] Slides up smoothly from bottom
- [ ] Backdrop dims background
- [ ] Swipe down dismisses (100px threshold)
- [ ] Tap backdrop dismisses
- [ ] Close button works
- [ ] Handle visible and draggable

### Body Scroll Lock
- [ ] Page scroll locked when open
- [ ] Content scrolls inside sheet
- [ ] Scroll position restored on close

### Desktop Modals
- [ ] Shows as centered modal (>=768px)
- [ ] Backdrop click dismisses
- [ ] ESC key dismisses

---

## Module 5: Mobile Game Lobby

### Card Layout
- [ ] Cards stack vertically on mobile
- [ ] Full-width with proper padding
- [ ] Clear visual hierarchy
- [ ] Proper spacing between cards

### Buttons
- [ ] All buttons minimum 48px height
- [ ] Touch targets easy to tap
- [ ] Active state feedback
- [ ] Disabled state clear

### Time Control
- [ ] Three options visible
- [ ] Active state shows (green)
- [ ] Easy to tap and switch

### Room Code
- [ ] Input accepts 6 characters
- [ ] Auto-uppercase works
- [ ] Join button enables when complete

---

## Module 6: Typography & Spacing

### Typography
- [ ] All text readable without zooming
- [ ] Headings have clear hierarchy
- [ ] Body text minimum 16px
- [ ] Line heights provide readability

### Spacing
- [ ] Consistent spacing throughout
- [ ] Touch targets minimum 44px
- [ ] Spacing between elements >=8px
- [ ] Comfortable visual rhythm

### Touch Targets
- [ ] All buttons >=44px height
- [ ] All clickable areas >=44x44px
- [ ] No accidental taps

---

## Module 7: Performance

### Load Times
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3.5s
- [ ] Bundle size <500KB gzipped

### Animations
- [ ] All animations 60fps
- [ ] No jank or stuttering
- [ ] Smooth transitions

### Resource Loading
- [ ] Lazy loading works
- [ ] Images load progressively
- [ ] No blocking requests

---

## Module 8: Gestures

### Long Press
- [ ] Long press (500ms) shows piece info
- [ ] Release before 500ms doesn't trigger
- [ ] Modal shows correct data

### Two-Finger Rotate
- [ ] Two-finger rotate flips board
- [ ] Rotation threshold prevents accidents
- [ ] Flip button also works

### Pull-to-Refresh
- [ ] Pull down triggers refresh (at top)
- [ ] Visual indicator shows progress
- [ ] Spinner shows during refresh

---

## Module 9: PWA

### Installation
- [ ] App can be installed (Add to Home Screen)
- [ ] Icons display correctly
- [ ] Splash screen shows
- [ ] Standalone mode works (no browser chrome)

### Offline
- [ ] Service worker registers
- [ ] Assets cached on first visit
- [ ] App works offline (cached pages)
- [ ] Offline page shows when no cache

### Updates
- [ ] Update notification appears
- [ ] Reload updates app
- [ ] No breaking changes

---

## Cross-Browser Testing

### Safari (iOS)
- [ ] Layout correct
- [ ] Touch interactions work
- [ ] PWA installable
- [ ] Service worker works
- [ ] No webkit bugs

### Chrome (Android)
- [ ] Layout correct
- [ ] Touch interactions work
- [ ] PWA installable
- [ ] Service worker works

### Firefox (Android)
- [ ] Layout correct
- [ ] Touch interactions work
- [ ] Basic functionality works

---

## Accessibility

### WCAG Compliance
- [ ] Color contrast >=4.5:1
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Screen reader friendly

### Touch Accessibility
- [ ] Touch targets >=44px
- [ ] No hover-only interactions
- [ ] Proper spacing between elements

---

## Edge Cases

### Network
- [ ] Works on slow 3G
- [ ] Handles offline gracefully
- [ ] Reconnects properly

### Orientation
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Orientation change smooth

### Interruptions
- [ ] Phone call doesn't break app
- [ ] Background/foreground works
- [ ] Screen lock/unlock works

---

## Launch Readiness

### Critical Path
- [ ] Can start game
- [ ] Can move pieces
- [ ] Can solve daily puzzle
- [ ] Can view KROG explanations
- [ ] Can navigate all sections

### Polish
- [ ] No console errors
- [ ] No visual glitches
- [ ] All text correct (no typos)
- [ ] All images load
- [ ] Animations smooth

### Documentation
- [ ] Help section complete
- [ ] FAQ accurate
- [ ] Tutorial clear

---

## Performance Benchmarks

### Lighthouse Scores (Mobile)
- [ ] Performance: >=90
- [ ] Accessibility: >=90
- [ ] Best Practices: >=90
- [ ] SEO: >=90
- [ ] PWA: >=90

### Bundle Sizes
- [ ] Total: <500KB gzipped
- [ ] JavaScript: <300KB gzipped
- [ ] CSS: <50KB gzipped

---

## Sign-Off

- [ ] All critical tests passed
- [ ] All modules tested on 3+ devices
- [ ] Lighthouse scores meet targets
- [ ] No blocking bugs
- [ ] Ready for launch

**Tested by:** _________________
**Date:** _________________
**Notes:** _________________

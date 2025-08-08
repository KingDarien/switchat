# SWITCHAT MVP: Three-Pane Feeds, Swipe Pager, and Customizable Profile

## Summary
- Implements an original SWITCHAT brand, palette, and layout
- Adds Voice, Video, and Posts feeds with smooth, fluid swipe navigation
- Voice feed: audio posts with play/pause, animated waveforms, and progress
- Video feed: vertical video, autoplay when in view, tap-to-mute
- Posts feed: text/image posts with inline comments
- Profile page: customizable banner (color/image), avatar, bio, featured media slot, and connections grid
- Mobile-first with scroll-snap paging and drag gestures; responsive for desktop

## Screens/Recordings (optional)
- Add screenshots or a short screen recording of feed swiping and the profile

## How to Test
1. Install deps and run dev server:
   - `npm install`
   - `npm run dev`
2. Visit `/`:
   - Use the tabs or swipe horizontally to switch Voice ⇄ Video ⇄ Posts
   - Verify audio play/pause, waveform animation, and progress bar
   - Verify video autoplay/pausing when visible and tap-to-mute toggle
   - Verify posts render images (if present) and accept inline comments
3. Visit `/profile`:
   - Confirm banner background, avatar, name, bio
   - Featured media slot should render the linked post (voice/video/post)
   - Connections grid shows friend previews

## Accessibility
- Focus rings for interactive elements
- High-contrast text and large interactive targets
- Keyboard navigation: Left/Right to switch pages in the pager

## Performance
- Vertical videos are `playsInline`, `muted` by default and use IntersectionObserver for autoplay/pause
- Assets are mock/sample only; production should use a media CDN and `next/image` for images

## Legal & Design Compliance
- All UI, layout, icons, and styling are original; no replication of protected assets from other platforms
- Brand identity is distinct to SWITCHAT; avoids proprietary colors, icons, or layouts

## Follow-ups / Next Iterations
- Replace `<img>` with `next/image` for optimization
- Post composers (record voice, upload video, write post)
- Offline caching for audio/video
- Haptic feedback and micro-interactions
- Theming controls and profile customization UX
# IIT Tirupati Exam Timer

A polished two-page examination timer for IIT Tirupati.

## Files

- `index.html` — application structure and both pages
- `css/style.css` — complete visual design
- `js/app.js` — timer, current-time mode, pause/resume and navigation

## Run

Open `index.html` in a modern browser.

No build process or server is required.

## IIT Tirupati logo

The header references the official IIT Tirupati logo hosted by the institute:

https://www.iittp.ac.in/CentralLibrary/images/logo/iittlogo.png

If you want the site to work completely offline, download the official logo into `assets/iitt-logo.png` and change the `<img src>` in `index.html` to:

assets/iitt-logo.png

## Features

- IIT Tirupati branding
- Examination name
- Countdown timer
- Current computer time
- Pause / resume
- Back to setup
- Responsive design
- Local browser execution
- Timer completion state
- Completion tone using Web Audio API


## Fullscreen & Screen Sleep Prevention

When the examiner presses **START EXAM TIMER**:

- The browser requests fullscreen mode.
- The browser requests the Screen Wake Lock API so supported browsers/devices do not turn the display off while the timer is active.
- If the browser temporarily releases the wake lock, the app requests it again when the page becomes visible.
- Returning to Setup releases the wake lock and exits fullscreen.

Browser security rules mean a website cannot guarantee that fullscreen will remain active after the user manually presses `Esc`, and some browsers/devices do not support Screen Wake Lock. The timer itself continues running.

```text
 /$$$$$$$   /$$$$$$   /$$$$$$        /$$  /$$$$$$    /$$  
| $$__  $$ /$$__  $$ /$$__  $$      | $$ /$$__  $$ /$$$$  
| $$  \ $$| $$  \__/|__/  \ $$  /$$$$$$$| $$  \ $$|_  $$  
| $$$$$$$ | $$ /$$$$   /$$$$$/ /$$__  $$|  $$$$$$/  | $$  
| $$__  $$| $$|_  $$  |___  $$| $$  | $$ >$$__  $$  | $$  
| $$  \ $$| $$  \ $$ /$$  \ $$| $$  | $$| $$  \ $$  | $$  
| $$$$$$$/|  $$$$$$/|  $$$$$$/|  $$$$$$$|  $$$$$$/ /$$$$$$
|_______/  \______/  \______/  \_______/ \______/ |______/
```

# KlipperKontrol

Industrial Android control panel for Klipper 3D printers.

KlipperKontrol is a touchscreen-oriented Android application designed to control a Klipper-based 3D printer through Moonraker.

Unlike Fluidd or Mainsail, KlipperKontrol is designed as a dedicated industrial control interface:
- minimal,
- readable from distance,
- fast,
- tactile,
- workshop-oriented.

# Android DNS Issue

Some Android devices using:
- custom DNS,
- ad blockers,
- private DNS,
- VPN DNS filtering,

may block GitHub release downloads or local Moonraker HTTP connections.

If APK downloads fail with errors such as:

```text
ERR_SSL_PROTOCOL_ERROR
```

try:
- disabling Private DNS,
- disabling DNS filtering,
- disabling adblock DNS,
- or temporarily switching back to automatic DNS.

This issue is unrelated to KlipperKontrol itself and is caused by Android network filtering.


---

# Features

## Real-time temperatures
- Hotend
- Bed
- Live Moonraker updates

## Temperature control
- Tap to edit temperatures
- Numeric input popup
- Instant Klipper commands

## Speed / Flow controls
- Touch sliders
- Magnetic snap at 100%
- Direct numeric input
- Individual reset buttons

## Emergency Stop
- Dedicated emergency stop button
- Confirmation popup
- Haptic feedback

## Print monitoring
- Live progress bar
- Percentage display
- Remaining print time
- Estimated total duration
- Current GCODE filename

## Responsive UI
Optimized for:
- 1024x600 displays
- Android tablets
- Raspberry Pi touchscreens
- KlipperScreen displays

---

# Technologies

- React Native
- Expo
- Moonraker API
- React Native Slider
- Expo Haptics

---

# Installation

## Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/KlipperKontrol.git
```

---

# Install dependencies

```bash
npm install
```

---

# Start development server

```bash
npx expo start --clear
```

Then:

```text
a
```

to launch directly on Android.

---

# Moonraker configuration

Edit inside:

```text
App.js
```

the line:

```javascript
const MOONRAKER_IP = '192.168.1.74'
```

with your Klipper server IP.

---

# Moonraker API

KlipperKontrol communicates with:

```text
http://IP:7125
```

---

# Endpoints used

## Printer status

```text
/printer/objects/query
```

## Send GCODE

```text
/printer/gcode/script
```

## Emergency stop

```text
/printer/emergency_stop
```

---

# Klipper commands

## Speed Factor

```gcode
M220 S100
```

## Flow Factor

```gcode
M221 S100
```

## Hotend Temperature

```gcode
M104 S220
```

## Bed Temperature

```gcode
M140 S80
```

---

# APK Build

## Install EAS CLI

```bash
npm install -g eas-cli
```

---

# Expo login

```bash
eas login
```

---

# Configure EAS

```bash
eas build:configure
```

---

# Generate APK

```bash
eas build -p android --profile preview
```

---

# Project structure

```text
KlipperKontrol/
│
├── App.js
├── app.json
├── eas.json
├── package.json
│
├── assets/
│
└── node_modules/
```

---

# ETA System

KlipperKontrol uses:
- dynamic ETA calculation,
- moving average,
- ETA smoothing,
- anti-spike filtering.

This creates:
- stable estimates,
- cleaner UI behavior,
- more realistic print times.

---

# Roadmap

## UI / UX
- glow effects
- smooth animations
- kiosk mode
- industrial themes
- always-on display

## Features
- webcam integration
- Klipper macros
- multi-printer support
- print history
- Android notifications

## System
- standalone APK
- Android autostart
- Moonraker watchdog
- offline mode

---

# Philosophy

KlipperKontrol is not intended to clone Fluidd.

The goal is to create:
- a dedicated control interface,
- extremely fast,
- tactile,
- readable from distance,
- designed for real workshop usage.

The objective is to transform an Android tablet into a real industrial 3D printer control panel.

---

# License

Personal / experimental project.

Free to modify and improve.

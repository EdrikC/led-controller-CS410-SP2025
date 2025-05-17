# User Manual

## Overview
This app lets you control an 8x8 RGB LED Matrix from your iPhone.

Features include:
- Drawing pixel art using touch or mouse
- Picking custom LED colors
- Saving and loading preset patterns
- Connecting to a Bluetooth-enabled LED matrix (ESP32)
- Sending full or partial matrix updates over Bluetooth or HTTP

---

## Setup Instructions

### Requirements
- Node.js and npm installed
- Xcode with command line tools (for iOS simulator testing)
- ESP32 device set up to accept HTTP or BLE connections
- Capacitor (installed as a dev dependency)

### Installation
Install dependencies by running:
```bash
npm install
```

### Running the App in the Browser
Start the development server:
```bash
npm run dev
```
Then open `http://localhost:5173` in your browser.

---

## iOS Deployment (Capacitor + Xcode)

### Step-by-Step
1. Build the project:
   ```bash
   npm run build
   ```

2. Sync the project with Capacitor:
   ```bash
   npx cap sync ios
   ```

3. Open the iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

4. In Xcode, select a simulator (e.g. iPhone 14), then click the **Play** button to build and launch the app.

---

## How to Use

### Drawing on the LED Grid
- Tap or click on any pixel to color it.
- Drag across multiple pixels to draw continuously.
- Tapping a pixel again will deselect (erase) it.

### Selecting a Color
- Use the color picker wheel or the predefined color buttons.
- The currently selected color will be applied when drawing.

### Saving & Loading Presets
- Type a name into the input field and click **Save Preset**.
- Saved presets appear below with options to **Load** or **Delete**.
- Presets are stored in `localStorage` on your device.

* Note: preset implementation is not fully completed 

### Power and Brightness
- Use the **Brightness Slider** to adjust light intensity (0–100%).
- The **Power Button** toggles all LEDs on or off.

### Sending to ESP32

#### HTTP Mode:
- Click **"Send Full Grid (HTTP)"** to POST the entire grid to the ESP32.

#### Bluetooth Mode:
- If your ESP32 is connected via Bluetooth, each pixel interaction is sent immediately.
- The app handles Bluetooth connection through the **BluetoothScanner** component.



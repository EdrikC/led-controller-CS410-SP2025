# Code Manual

## Overview
This application is a React-based UI for controlling an 8x8 RGB LED Matrix using both HTTP and Bluetooth (BLE) communication.

## Main Components

### App.jsx
- The main app container that manages state and orchestrates interactions.
- Controls grid data, selected color, power state, and handles communication.
- Coordinates all subcomponents:
  - PixelBoard (grid)
  - ColorPicker (UI for choosing color)
  - PresetPanel (saving/loading patterns)
  - BluetoothManager (BLE communication)

### PixelBoard.jsx
- Renders an 8x8 matrix of pixel components.
- Allows for pixel-level drawing, erasing, and drag interactions.
- Handles both pointer and touch input for cross-device compatibility.
- Supports brightness and power toggling logic.
- Communicates selected pixels and gestures back to App via callbacks.

### ColorPicker.jsx
- Allows users to select a color from a palette or use a custom color wheel.
- Sends the selected color to the parent component using `onColorChange`.

### PresetPanel.jsx
- Lets users name and save their current grid state.
- Uses `localStorage` to persist patterns across sessions.
- Loads saved presets and updates the grid accordingly.

### BluetoothManager.jsx
- Scans for nearby Bluetooth devices (ESP32).
- Connects and sends pixel coordinates or reset commands via BLE.
- Uses React `ref` and `useImperativeHandle` to expose BLE control functions to App.

## State Flow
- `App` holds core state for the grid, color, power, and Bluetooth.
- `PixelBoard` informs `App` when the grid changes or when pixels are clicked.
- `App` optionally sends those pixel actions to the ESP32 device.

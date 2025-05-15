import React, { useState, useRef } from 'react';
import PixelBoard from './components/PixelBoard';
import ColorPicker from './components/ColorPicker';
import PresetPanel from './components/PresetPanel';
import BluetoothScanner from './components/BluetoothManager';

import './App.css';

const MemoizedPixelBoard = React.memo(PixelBoard);

/**
 * App Component
 *
 * This is the main application wrapper for the LED Matrix Drawer.
 * It manages:
 * - Global state for the LED grid and selected color
 * - Communication with the ESP32 device via HTTP and Bluetooth
 * - Integration with child components:
 *   - PixelBoard (interactive 8x8 LED grid)
 *   - ColorPicker (choose LED color)
 *   - PresetPanel (save/load LED patterns)
 *   - BluetoothScanner (handles BLE communication with ESP32)
 *
 * Features:
 * - Draw/erase on LED grid
 * - Save/load patterns from local storage
 * - Send full grid via HTTP to ESP32
 * - Send individual LED commands via Bluetooth
 */
function App() {
  // State for grid data, color, and power
  const SIZE = 8;
  const emptyGrid = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill('#000000'));
  const [gridData, setGridData] = useState(emptyGrid());
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [isOn, setIsOn] = useState(true); // State for local power control

  // --- Bluetooth Integration ---
  // Create a ref to access the BluetoothScanner component's exposed functions
  const bluetoothRef = useRef(null);

  // This function is called by PixelBoard when a pixel is clicked
  const handlePixelClick = (row, col) => {
    console.log(`App received pixel click at (${row}, ${col})`);
    // Check if the bluetoothScanner ref is available and connected (optional but good practice)
    // The isConnected function is exposed via useImperativeHandle in the modified BluetoothScanner
    if (bluetoothRef.current && bluetoothRef.current.isConnected()) {
       console.log(`Calling sendPixelCommand for pixel (${row}, ${col})...`);
       // Call the exposed sendPixelCommand function on the BluetoothScanner instance
       bluetoothRef.current.sendPixelCommand(row, col);
    } else {
       console.warn("Bluetooth not connected or scanner not ready. Cannot send command.");
    }
  };


   const handleResetClick = () => {
    console.log(`App received reset click`);
    if (bluetoothRef.current && bluetoothRef.current.isConnected()) {
       console.log(`Calling handleResetClick `);
       // Calls the exposed sendResetCommand function on the BluetoothScanner instance
       bluetoothRef.current.sendResetCommand();
    } else {
       console.warn("Bluetooth not connected or scanner not ready. Cannot send command.");
      
    }
  };

  
  // --- End Bluetooth Integration ---


  // Function to send the *entire* grid data via HTTP (assuming your ESP32 has an HTTP server)
  // This is separate from the BLE pixel command logic.
  const handleSendToMatrix = () => {
    // You might want to filter out default color pixels here before sending
    const activePixels = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (gridData[r][c] !== '#000000') { // Assuming '#000000' is the default/off color
                // Send color data too, or just coordinates depending on API
                activePixels.push({ row: r + 1, col: c + 1, color: gridData[r][c] });
            }
        }
    }

    // Original fetch logic - make sure the URL and payload match your ESP32 HTTP server
    fetch('http://192.168.4.1/matrix', { // Verify this IP address and endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: activePixels }), // Sending filtered data might be more efficient
      // Or send the whole grid: body: JSON.stringify({ grid: gridData }),
    })
    .then(response => {
        if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Or response.json() if server returns JSON
    })
    .then(data => {
        console.log('HTTP send success:', data);
        alert('Pattern sent to matrix via HTTP!');
    })
    .catch((err) => {
        console.error('Failed to send grid via HTTP:', err);
        alert(`Failed to send grid via HTTP: ${err.message}`);
    });
  };

  // Function for local power toggle state (you might want this to trigger a BLE command too)
  const togglePower = () => {
    setIsOn((prev) => !prev);
    // TODO: Add logic here to send a power command via BLE if connected
    // if (bluetoothRef.current && bluetoothRef.current.isConnected()) {
    //    bluetoothRef.current.sendPowerCommand(isOn ? 'off' : 'on'); // Assuming you add a sendPowerCommand function to BluetoothScanner
    // }
  };

  return (
    <div className="App" style={{padding: '1rem'}}>
      <h1>8x8 Matrix LED Drawer</h1>

      {/* Color Picker */}
      <ColorPicker
        onColorChange={setSelectedColor}
        selectedColor={selectedColor}
      />

      {/* Pixel Board */}
      {/* Pass the handlePixelClick function as the onPixelClick prop */}
      <MemoizedPixelBoard
        onGridChange={setGridData} // PixelBoard notifies App of grid changes
        selectedColor={selectedColor}
        initialGrid={gridData}
        onPixelClick={handlePixelClick}
        onResetClick={handleResetClick}
      />

      {/* Preset Panel */}
      <PresetPanel
        gridData={gridData}
        setGridData={setGridData}
      />

      {/* Local Controls (Optional - consider moving these to control BLE) */}
      <div style={{ margin: '20px' }}>
        <button onClick={togglePower}>
          {isOn ? 'Turn OFF (Local State)' : 'Turn ON (Local State)'}
        </button>
        {/* TODO: Replace with BLE power control */}
      </div>

      {/* HTTP Send Button */}
      {/* This button sends the WHOLE grid state, different from BLE single pixel command */}
      <button onClick={handleSendToMatrix}>Send Full Grid (HTTP)</button>

      {/* Bluetooth Scanner */}
      {/* Pass the ref to the BluetoothScanner component */}
      <div>
        <BluetoothScanner ref={bluetoothRef} /> {/* <-- Pass the ref here */}
      </div>

      {/* Remove the unused state and handler */}
      {/* const [sendToDevice, setSendToDevice] = useState(null); */}
      {/* const handleReadyToSend = (sendFunction) => { setSendToDevice(() => sendFunction); }; */}

    </div>
  );
}

export default App;
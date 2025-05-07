import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';

// Wrap the component with forwardRef so a ref can be passed to it
const BluetoothScanner = forwardRef((props, ref) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]); // Array of BleDevice objects
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initialize BLE...');
  const [errorMessage, setErrorMessage] = useState(null);

  // For BLE test
  // const TEST_SERVICE = '4FAFC201-1FB5-459E-8FCC-C5C9C331914B';
  // const TEST_CHARACTERISTIC = 'BEB5483E-36E1-4688-B7F5-EA07361B26A8';

  // For lightblue
  const TEST_SERVICE = 'FA1AE785-8590-4F81-9415-9A6C7806BA1E';
  const TEST_CHARACTERISTIC = 'DBC13BE4-69A7-4C94-97EA-DA7B6783845A';

  // Ref to store the connected device ID for cleanup, avoids stale state in cleanup function
  const connectedDeviceRef = useRef(null);

  // --- Expose functions via ref ---
  // This allows a parent component holding a ref to this component to call these functions
  useImperativeHandle(ref, () => ({
    // Expose sendTestValue so the parent can call it with coords
    sendPixelCommand: sendPixelCommand,
    // You might expose other relevant functions if needed by the parent
    isConnected: () => !!connectedDevice, // Example: expose connection status
    sendResetCommand: sendResetCommand,
    // startScan, // Or expose scan functions etc.
  }));


  // --- Initialization ---
  useEffect(() => {
    const initializeBle = async () => {
      try {
        await BleClient.initialize({});
        setIsInitialized(true);
        setStatusMessage('BLE Initialized. Ready to scan.');
        setErrorMessage(null);
      } catch (error) {
        console.error('BLE Initialize Error:', error);
        setErrorMessage(`BLE Initialize Error: ${error.message || error}`);
        setStatusMessage('BLE Initialization Failed');
        setIsInitialized(false);
      }
    };
    initializeBle();

    // --- Cleanup on Unmount ---
    return () => {
      const cleanup = async () => {
        console.log('Cleaning up BLE...');
        try {
          await BleClient.stopLEScan();
          console.log('Scan stopped on cleanup.');
          if (connectedDeviceRef.current) {
            // Note: BleClient.disconnect doesn't need the device ID
            await BleClient.disconnect(connectedDeviceRef.current.deviceId); // deviceId here
            console.log(`Disconnected from ${connectedDeviceRef.current.deviceId} on cleanup.`);
            connectedDeviceRef.current = null;
            setConnectedDevice(null);
          }
        } catch (error) {
          console.error('Error during BLE cleanup:', error);
        }
      };
      cleanup();
    };
  }, []);

  // --- Scanning Logic ---
  const startScan = async () => {
    if (!isInitialized || isScanning) return;

    setDevices([]);
    setErrorMessage(null);
    setStatusMessage('Scanning...');
    setIsScanning(true);

    const MIN_RSSI = -70;
    const MAX_DEVICES = 10; // Keep track of device limit


    try {
      await BleClient.requestLEScan(
        {
          // services: [TEST_SERVICE], // Uncomment if you want to filter by service
          // namePrefix: "TestLED", // Uncomment to filter by device name prefix
          // scanMode: ScanMode.SCAN_MODE_LOW_LATENCY, // Use if you need faster scanning (more power)
          allowDuplicates: false // Set to true to get updates on RSSI changes for same device
        },
        (result) => {
           // Auto-connect logic (optional)
          if (result.device && result.device.name === 'TestLED' && !connectedDeviceRef.current) {
             console.log("Found TestLED, stopping scan and attempting connection...");
             BleClient.stopLEScan().then(() => {
                setIsScanning(false); // Update scan state immediately
                handleConnect(result.device); // Attempt to connect
             }).catch(err => console.error("Error stopping scan for auto-connect:", err));
             return; // Stop processing this scan result further
          }

          if (result?.device) {
            setDevices((prevDevices) => {
              // Basic filtering
              if (result.rssi < MIN_RSSI) return prevDevices;
              // if (result.device.name === null || !result.device.name.startsWith('TestLED')) return prevDevices; // Example name filter

              // Check if device already exists by ID
              if (prevDevices.find(d => d.deviceId === result.device.deviceId)) {
                 // Optional: Update RSSI for existing device if allowDuplicates is true
                 // if (result.rssi && allowDuplicates) { ... update logic ... }
                 return prevDevices;
              }

              // Add new device, limiting the total number
              const newDevices = [...prevDevices, result.device];
              // Keep only the first MAX_DEVICES, maybe sort by RSSI or just keep discovery order
              return newDevices.slice(0, MAX_DEVICES);
            });
          }
        }
      );

      console.log('Scan started, will stop in 5 seconds.');

      const scanTimeout = setTimeout(() => {
        console.log('Scan timeout reached.');
        stopScan();
      }, 5000);

      

    } catch (error) {
      console.error('BLE Scan Error:', error);
      setErrorMessage(`Scan Error: ${error.message || error}`);
      setStatusMessage('Scan failed');
      setIsScanning(false);
    }
  };

  // --- Sending Logic (Modified) ---

  // Accepts row and column for the command
  const sendPixelCommand = async (row, col) => {
    if (!connectedDevice) {
      setStatusMessage('Not connected to a device.');
      return;
    }

    // Construct the command string based on coordinates
    // Assuming format "led <row> <col> on" or similar
    // Adjust this format based on what your ESP32 expects
    const commandString = `led [${row},${col}]`; // Example format

    try {
      // Read current value first (useful for debugging or state sync)
      const readResult = await BleClient.read(connectedDevice.deviceId, TEST_SERVICE, TEST_CHARACTERISTIC);
      console.log("Current characteristic value:", new TextDecoder().decode(readResult));

      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(commandString);

      // BleClient.write expects a DataView or Uint8Array
      const valueToSend = uint8Array; // Uint8Array works directly


      console.log("Attempting to send command:", commandString);

      await BleClient.write(
        connectedDevice.deviceId,
        TEST_SERVICE,
        TEST_CHARACTERISTIC,
        valueToSend
      );

      setStatusMessage(`Sent command: ${commandString}`);


    } catch (error) {
      console.error('BLE Send Error:', error);
      setStatusMessage(`Send error: ${error.message}`);
      setErrorMessage(`Send Error: ${error.message || error}`);
    }
  };

  const sendResetCommand = async () => {
    if (!connectedDevice) {
      setStatusMessage('Not connected to a device.');
      return;
    }


    const commandString = "reset";

    try {
      // Read current value first (useful for debugging or state sync)
      const readResult = await BleClient.read(connectedDevice.deviceId, TEST_SERVICE, TEST_CHARACTERISTIC);
      console.log("Current characteristic value:", new TextDecoder().decode(readResult));

      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(commandString);

      // BleClient.write expects a DataView or Uint8Array
      const valueToSend = uint8Array; // Uint8Array works directly


      console.log("Attempting to send command:", commandString);

      await BleClient.write(
        connectedDevice.deviceId,
        TEST_SERVICE,
        TEST_CHARACTERISTIC,
        valueToSend
      );

      setStatusMessage(`Sent command: ${commandString}`);


    } catch (error) {
      console.error('BLE Send Error:', error);
      setStatusMessage(`Send error: ${error.message}`);
      setErrorMessage(`Send Error: ${error.message || error}`);
    }
  };


  const stopScan = async () => {
    if (!isScanning) return;
    try {
      await BleClient.stopLEScan();
      console.log('Scan stopped manually.');
      setStatusMessage('Scan stopped.');
    } catch (error) {
      console.error('BLE Stop Scan Error:', error);
      setErrorMessage(`Stop Scan Error: ${error.message || error}`);
    } finally {
      setIsScanning(false);
    }
  };

  // --- Connection Logic ---
  const handleConnect = async (device) => {
    // Prevent connecting if already connected or not initialized
    if (!isInitialized || connectedDevice) {
        console.log("Connect aborted: Already connected or not initialized.");
        return;
    }

    // Ensure scan is stopped before connecting
    if (isScanning) {
      console.log("Stopping scan before connecting...");
      await stopScan();
    }

    setStatusMessage(`Connecting to ${device.name || device.deviceId}...`);
    setErrorMessage(null);

    try {
      // Attempt connection. iOS handles bonding/pairing implicitly if needed.
      await BleClient.connect(device.deviceId, (disconnectedId) => {
        // On disconnect callback - this is called when the device disconnects
        console.log(`Device ${disconnectedId} disconnected`);
        setStatusMessage(`Device ${disconnectedId} disconnected`);
        setConnectedDevice(null);
        connectedDeviceRef.current = null; // Clear ref immediately on disconnect
        setErrorMessage(null); // Clear any previous error on disconnect
      });

      console.log(`Connected to ${device.deviceId}`);
      setStatusMessage(`Connected to ${device.name || device.deviceId}`);
      setConnectedDevice(device);
      // Use device object for ref to easily access name etc. if needed elsewhere
      connectedDeviceRef.current = device;

      // Optional: Discover services/characteristics here if needed
      // const services = await BleClient.getServices(device.deviceId);
      // console.log('Discovered services', services);


    } catch (error) {
      console.error('BLE Connect Error:', error);
      setErrorMessage(`Connection Error: ${error.message || error}`);
      setStatusMessage(`Failed to connect to ${device.name || device.deviceId}`);
      setConnectedDevice(null);
      connectedDeviceRef.current = null;
    }
  };

  const handleDisconnect = async () => {
    if (!connectedDevice) return;

    setStatusMessage('Disconnecting...');
    setErrorMessage(null);
    try {
      // Call disconnect using the deviceId
      await BleClient.disconnect(connectedDevice.deviceId);
      console.log(`Disconnect initiated for ${connectedDevice.deviceId}`);
      // The disconnect callback set in handleConnect should handle the state update
      // setConnectedDevice(null); // State update should happen in the callback
      // connectedDeviceRef.current = null; // Ref update should happen in the callback

    } catch (error) {
      console.error('BLE Disconnect Error:', error);
      setErrorMessage(`Disconnect Error: ${error.message || error}`);
      setStatusMessage('Failed to disconnect');
       // Force state update if callback didn't fire for some reason (rare)
       setConnectedDevice(null);
       connectedDeviceRef.current = null;
    }
  };


  // Render logic remains mostly the same
  return (
    <div style={styles.container}>
      <h2>Bluetooth LE Scanner</h2>

      {/* Status & Error Messages */}
      <p style={styles.status}>{statusMessage}</p>
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}

      {/* Controls */}
      <div style={styles.controls}>
        {!isScanning ? (
          <button onClick={startScan} disabled={!isInitialized || !!connectedDevice}>
            Start Scan
          </button>
        ) : (
          <button onClick={stopScan}>Stop Scan</button>
        )}
        {connectedDevice && (
          <button onClick={handleDisconnect} style={styles.disconnectButton}>
            Disconnect
          </button>
        )}
         {/* Removed the test button, will be triggered by PixelBoard */}
        {/* {connectedDevice && (
           <button onClick={() => sendPixelCommand(5, 5)}>Send Test Value (5,5)</button>
         )} */}
      </div>

      {/* Device List */}
      <h3>Available Devices:</h3>
      {isScanning && devices.length === 0 && <p>Searching...</p>}
      {!isScanning && !isScanning && devices.length === 0 && <p>No devices found.</p>} {/* Corrected logic */}


      <ul style={styles.deviceList}>
        {devices.map((device) => (
          <li
            key={device.deviceId}
            style={styles.deviceItem}
            onClick={() => handleConnect(device)} // Make list item clickable to connect
          >
            <strong>{device.name || 'Unnamed Device'}</strong> <br />
            <small>ID: {device.deviceId}</small> <br />
             {/* Only show RSSI if available */}
            {device.rssi !== undefined && device.rssi !== null && <small>RSSI: {device.rssi}</small>}
          </li>
        ))}
         {/* Show connected device info in the list if not scanning */}
        {!isScanning && connectedDevice && !devices.find(d => d.deviceId === connectedDevice.deviceId) && (
             <li key={connectedDevice.deviceId} style={{...styles.deviceItem, backgroundColor: '#e0ffe0'}}>
                 <strong>{connectedDevice.name || 'Unnamed Device'}</strong> <br />
                 <small>ID: {connectedDevice.deviceId}</small> <br />
                 <small>Status: Connected</small>
             </li>
         )}
      </ul>
    </div>
  );
}); // End forwardRef

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  status: {
    fontWeight: 'bold',
    minHeight: '1.2em',
    color: 'blue', // Style status message
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  controls: {
    margin: '15px 0',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  disconnectButton: {
    backgroundColor: '#ffcccc',
  },
  deviceList: {
    listStyle: 'none',
    padding: 0,
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #ccc',
    marginTop: '10px',
    borderRadius: '5px',
  },
  deviceItem: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    backgroundColor: '#fff',
    transition: 'background-color 0.2s ease',
  },
  // Add hover effect
  deviceItemHover: {
     backgroundColor: '#f0f0f0',
  }
};

// Add hover style dynamically or use CSS class
// For simplicity, keeping it inline for now, but CSS is better
// styles.deviceItem[':hover'] = styles.deviceItemHover; // This syntax won't work with plain objects, needs CSS modules or styled-components

export default BluetoothScanner;
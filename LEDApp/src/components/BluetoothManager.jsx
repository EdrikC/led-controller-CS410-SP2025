import React, { useState, useEffect, useRef } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';


function BluetoothScanner() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]); // Array of BleDevice objects
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initialize BLE...');
  const [errorMessage, setErrorMessage] = useState(null);


  // For BLE test
  const TEST_SERVICE = '4FAFC201-1FB5-459E-8FCC-C5C9C331914B';
  const TEST_CHARACTERISTIC = 'BEB5483E-36E1-4688-B7F5-EA07361B26A8';


  // Ref to store the connected device ID for cleanup, avoids stale state in cleanup function
  const connectedDeviceRef = useRef(null);

  // --- Initialization ---
  useEffect(() => {
    const initializeBle = async () => {
      try {

        // Initialize the BleClient. Stops previous session if any.
        await BleClient.initialize({
        });

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
    // Initialize BLE
    initializeBle();

    // --- Cleanup on Unmount ---
    // This function will run when the component is removed from the UI
    return () => {
      const cleanup = async () => {
        console.log('Cleaning up BLE...');
        try {
          // Stop scanning if active (safe to call even if not scanning)
          await BleClient.stopLEScan();
          console.log('Scan stopped on cleanup.');

          // Disconnect if connected (useRef for accurate ID)
          if (connectedDeviceRef.current) {
            await BleClient.disconnect(connectedDeviceRef.current);
            console.log(`Disconnected from ${connectedDeviceRef.current} on cleanup.`);
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

    setDevices([]); // Clearing previous list of devices
    setErrorMessage(null);
    setStatusMessage('Scanning...');
    setIsScanning(true);

    // For Received Signal Strength Indication. Higher = closer
    const MIN_RSSI = -70; 
    const NAME_PREFIX = "ESP"; // For when we need to find the ESP
    const MAX_DEVICES = 10;


    try {
      // Start scanning
    //   https://github.com/capacitor-community/bluetooth-le?tab=readme-ov-file#requestlescan <- Docs for this section
      await BleClient.requestLEScan(
        {
          // Scans only for the test service UUID for now
          //  services: [TEST_SERVICE],
           // namePrefix: "MyDevice",
           // scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
           allowDuplicates: false
        },
        (result) => {
          if (result.device && result.device.name === 'TestLED') {
            BleClient.stopLEScan();
            handleConnect(result.device);
          }
          if (result?.device) {
            setDevices((prevDevices) => {
              // Filter by RSSI
              if (result.rssi < MIN_RSSI) return prevDevices;
  
              // Filter by name prefix (for later)
              // if (NAME_PREFIX && !result.device.name?.startsWith(NAME_PREFIX)) return prevDevices;
  
              // Check if device already exists
              if (prevDevices.find(d => d.deviceId === result.device.deviceId)) return prevDevices;
  
              // Add new device, but limit total number
              const newDevices = [...prevDevices, result.device];
              return newDevices.slice(0, MAX_DEVICES);
            });
          }
        }
      );

      setTimeout(stopScan, 5000); // Stop scan after 5 seconds

    } catch (error) {
      console.error('BLE Scan Error:', error);
      setErrorMessage(`Scan Error: ${error.message || error}`);
      setStatusMessage('Scan failed');
      setIsScanning(false);
    }
  };

  const sendTestValue = async () => {
    if (!connectedDevice) return;
    
    try {
      // Quick test to read the current characteristic value and can see that it holds 8 bytes of data
      const readResult = await BleClient.read(
        connectedDevice.deviceId,
        TEST_SERVICE,
        TEST_CHARACTERISTIC
      );
      console.log("Current characteristic value:", new TextDecoder().decode(readResult));
  
      const stringToSend = "led 5 5 on";


      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(stringToSend);

      // Create a DataView from the Uint8Array
      const valueToSend = new DataView(uint8Array.buffer);

      console.log("Attempting to send string:", stringToSend);


      await BleClient.write(
        connectedDevice.deviceId,
        TEST_SERVICE,
        TEST_CHARACTERISTIC,
        valueToSend
      );
      setStatusMessage('Value sent successfully');
      
      // Read again to confirm change
      const confirmRead = await BleClient.read(
        connectedDevice.deviceId,
        TEST_SERVICE,
        TEST_CHARACTERISTIC
      );
      console.log("New characteristic value:", new Uint8Array(confirmRead.buffer));
    } catch (error) {
      setStatusMessage(`Send error: ${error.message}`);
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
    if (!isInitialized || connectedDevice) return;

    if (isScanning) {
      await stopScan(); // Stop scanning before attempting to connect
    }

    setStatusMessage(`Connecting to ${device.name || device.deviceId}...`);
    setErrorMessage(null);

    try {
      // Attempt connection. iOS handles bonding/pairing implicitly if needed.
      await BleClient.connect(device.deviceId, (disconnectedId) => {
        // On disconnect callback
        console.log(`Device ${disconnectedId} disconnected`);
        setStatusMessage(`Device ${disconnectedId} disconnected`);
        setConnectedDevice(null);
        connectedDeviceRef.current = null;
      });

      console.log(`Connected to ${device.deviceId}`);
      setStatusMessage(`Connected to ${device.name || device.deviceId}`);
      setConnectedDevice(device);
      connectedDeviceRef.current = device;


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
      await BleClient.disconnect(connectedDevice.deviceId);
      console.log(`Disconnect initiated for ${connectedDevice}`);
    } catch (error) {
      console.error('BLE Disconnect Error:', error);
      setErrorMessage(`Disconnect Error: ${error.message || error}`);
      setStatusMessage('Failed to disconnect');
      // Force state update if callback didn't fire for some reason
      setConnectedDevice(null);
      connectedDeviceRef.current = null;
    }
  };

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
        {connectedDevice && (
        <button onClick={sendTestValue}>Send Test Value</button>
      )}
      </div>

      {/* Device List */}
      <h3>Available Devices:</h3>
      {isScanning && devices.length === 0 && <p>Searching...</p>}
      {!isScanning && devices.length === 0 && <p>No devices found.</p>}

      <ul style={styles.deviceList}>
        {devices.map((device) => (
          <li
            key={device.deviceId}
            style={styles.deviceItem}
            onClick={() => handleConnect(device)} // Make list item clickable to connect
          >
            <strong>{device.name || 'Unnamed Device'}</strong> <br />
            <small>ID: {device.deviceId}</small> <br />
            {device.rssi && <small>RSSI: {device.rssi}</small>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  status: {
    fontWeight: 'bold',
    minHeight: '1.2em',
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
  },
  deviceItem: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  },
};

export default BluetoothScanner;


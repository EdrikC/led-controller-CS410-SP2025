import React, { useState, useEffect, useRef } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';


function BluetoothScanner() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]); // Array of BleDevice objects
  const [connectedDeviceId, setConnectedDeviceId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initialize BLE...');
  const [errorMessage, setErrorMessage] = useState(null);

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
            setConnectedDeviceId(null);
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

    try {
      // Start scanning
    //   https://github.com/capacitor-community/bluetooth-le?tab=readme-ov-file#requestlescan <- Docs for this section
      await BleClient.requestLEScan(
        {
           // services: [],
           // namePrefix: "MyDevice",
           // scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
           allowDuplicates: false
        },
        (result) => {
          if (result?.device) {
            // Add device to list if it's not already there
            setDevices((prevDevices) => {
              if (!prevDevices.find(d => d.deviceId === result.device.deviceId)) {
                return [...prevDevices, result.device];
              }
              return prevDevices;
            });
          }
        }
      );

      setTimeout(stopScan, 15000); // Stop scan after 15 seconds

    } catch (error) {
      console.error('BLE Scan Error:', error);
      setErrorMessage(`Scan Error: ${error.message || error}`);
      setStatusMessage('Scan failed');
      setIsScanning(false);
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
    if (!isInitialized || connectedDeviceId) return;

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
        setConnectedDeviceId(null);
        connectedDeviceRef.current = null;
      });

      console.log(`Connected to ${device.deviceId}`);
      setStatusMessage(`Connected to ${device.name || device.deviceId}`);
      setConnectedDeviceId(device.deviceId);
      connectedDeviceRef.current = device.deviceId;


    } catch (error) {
      console.error('BLE Connect Error:', error);
      setErrorMessage(`Connection Error: ${error.message || error}`);
      setStatusMessage(`Failed to connect to ${device.name || device.deviceId}`);
      setConnectedDeviceId(null);
      connectedDeviceRef.current = null;
    }
  };

  const handleDisconnect = async () => {
    if (!connectedDeviceId) return;

    setStatusMessage('Disconnecting...');
    setErrorMessage(null);
    try {
      await BleClient.disconnect(connectedDeviceId);
      console.log(`Disconnect initiated for ${connectedDeviceId}`);
    } catch (error) {
      console.error('BLE Disconnect Error:', error);
      setErrorMessage(`Disconnect Error: ${error.message || error}`);
      setStatusMessage('Failed to disconnect');
      // Force state update if callback didn't fire for some reason
      setConnectedDeviceId(null);
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
          <button onClick={startScan} disabled={!isInitialized || !!connectedDeviceId}>
            Start Scan
          </button>
        ) : (
          <button onClick={stopScan}>Stop Scan</button>
        )}
        {connectedDeviceId && (
          <button onClick={handleDisconnect} style={styles.disconnectButton}>
            Disconnect
          </button>
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


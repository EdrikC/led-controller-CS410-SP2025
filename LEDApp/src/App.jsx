import React, { useState } from 'react';
import PixelBoard from './components/PixelBoard';
import ColorPicker from './components/ColorPicker';
import PresetPanel from './components/PresetPanel';
import BluetoothScanner from './components/BluetoothManager';

import './App.css';

const MemoizedPixelBoard = React.memo(PixelBoard);

function App() {
  const SIZE = 8;
  const emptyGrid = () =>
    Array(SIZE).fill(null).map(() => Array(SIZE).fill('#000000'));

  const [gridData, setGridData] = useState(emptyGrid());
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [brightness, setBrightness] = useState(100);
  const [isOn, setIsOn] = useState(true);

  let brightnessTimeout = null;

  const handleSendToMatrix = () => {
    fetch('http://192.168.4.1/matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: gridData }),
    })
      .then(() => alert('Pattern sent to matrix!'))
      .catch((err) => console.error('Failed to send grid:', err));
  };

  const handleBrightnessChange = (event) => {
    const newBrightness = parseInt(event.target.value, 10);
    if (!brightnessTimeout) {
      setBrightness(newBrightness);
      console.log(`New Brightness: ${newBrightness}%`);
      brightnessTimeout = setTimeout(() => {
        brightnessTimeout = null;
      }, 100); // adjust timing if you want more/less throttle
    }
  };


  const togglePower = () => {
    if (isOn) {
      console.log('Turning OFF');
      setBrightness(0);
    } else {
      console.log('Turning ON');
      setBrightness(100);
    }
    setIsOn(!isOn);
  };

  return (
    <div className="App">
      <h1>8x8 Matrix LED Drawer</h1>

      <ColorPicker
        onColorChange={setSelectedColor}
        selectedColor={selectedColor}
      />

      <MemoizedPixelBoard
        onGridChange={setGridData}
        selectedColor={selectedColor}
        initialGrid={gridData}
      />

      <PresetPanel
        gridData={gridData}
        setGridData={setGridData}
      />


      <div style={{ margin: '20px' }}>
        <label>Brightness: {brightness}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={brightness}
          onChange={handleBrightnessChange}
        />
      </div>


      <div style={{ margin: '20px' }}>
        <button onClick={togglePower}>
          {isOn ? 'Turn OFF' : 'Turn ON'}
        </button>
      </div>

      <button onClick={handleSendToMatrix}>Send to Matrix</button>

      <div>
        <BluetoothScanner />
      </div>
    </div>
  );
}

export default App;

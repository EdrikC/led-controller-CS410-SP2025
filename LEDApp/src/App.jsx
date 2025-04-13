import React, { useState } from 'react';
import PixelBoard from './components/PixelBoard';
import ColorPicker from './components/ColorPicker';
import PresetPanel from './components/PresetPanel';

import './App.css';

function App() {
  const SIZE = 8;
  const emptyGrid = () =>
    Array(SIZE).fill(null).map(() => Array(SIZE).fill('#000000'));

  const [gridData, setGridData] = useState(emptyGrid());

  const [selectedColor, setSelectedColor] = useState('#FFFFFF'); 

  const handleSendToMatrix = () => {
    fetch('http://192.168.4.1/matrix', { // Replace with ESP8266 IP
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: gridData }),
    })
      .then(() => alert('Pattern sent to matrix!'))
      .catch((err) => console.error('Failed to send grid:', err));
  };

  return (
    <div className="App">
      <h1>8x8 Matrix LED Drawer</h1>
      <ColorPicker 
        onColorChange={setSelectedColor} 
        selectedColor={selectedColor} 
      />
      <PixelBoard 
        onGridChange={setGridData} 
        selectedColor={selectedColor} 
        initialGrid={gridData}
      />
     <PresetPanel gridData={gridData}
      setGridData={setGridData} 
      />

      <button onClick={handleSendToMatrix}>Send to Matrix</button>
    </div>
  );
}

export default App;
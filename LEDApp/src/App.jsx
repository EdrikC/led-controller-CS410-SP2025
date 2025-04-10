import React, { useState } from 'react';
import PixelBoard from './components/PixelBoard';
import ColorPicker from './components/ColorPicker';
import './App.css';

function App() {
  const [gridData, setGridData] = useState([]);
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
      />
      <button onClick={handleSendToMatrix}>Send to Matrix</button>
    </div>
  );
}

export default App;
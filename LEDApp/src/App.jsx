import React, { useState } from 'react';
import PixelBoard from './components/PixelBoard';
import './App.css';

function App() {
  const [gridData, setGridData] = useState([]);

  const handleSendToMatrix = () => {
    fetch('http://192.168.4.1/matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: gridData }),
    })
    .then(() => alert('Pattern sent to matrix!'))
    .catch(err => console.error('Failed to send grid:', err));
  };

  return (
    <div className="App">
      <h1>8x8 Matrix LED Drawer</h1>
      <PixelBoard onGridChange={setGridData} />
      <button onClick={handleSendToMatrix}>Send to Matrix</button>
    </div>
    
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import './PixelBoard.css';

const SIZE = 8;
const DEFAULT_COLOR = '#000000';

function PixelBoard({ onGridChange, selectedColor, initialGrid }) {
  const createEmptyGrid = () => Array(SIZE).fill().map(() => Array(SIZE).fill(DEFAULT_COLOR));
  const [grid, setGrid] = useState(initialGrid || createEmptyGrid());
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('draw');
  const [brightness, setBrightness] = useState(100);
  const [power, setPower] = useState(true); // ON by default

  useEffect(() => {
    const preventDefaultTouch = (e) => {
      if (e.target.closest('.pixel-board')) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => {
      document.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  useEffect(() => {
    const handleEnd = () => setIsDrawing(false);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  useEffect(() => {
    if (initialGrid?.length === SIZE) setGrid(initialGrid);
  }, [initialGrid]);

  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const updatePixel = (rowIdx, colIdx) => {
    setGrid(prev => prev.map((row, r) =>
      row.map((cell, c) => {
        if (r === rowIdx && c === colIdx) {
          const shouldDraw = drawMode === 'draw' && cell !== selectedColor;
          const shouldErase = drawMode === 'erase' && cell !== DEFAULT_COLOR;
          return shouldDraw ? selectedColor : shouldErase ? DEFAULT_COLOR : cell;
        }
        return cell;
      })
    ));
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target?.classList.contains('pixel')) {
      const [r, c] = target.getAttribute('data-rc').split('-').map(Number);
      updatePixel(r, c);
    }
  };

  const resetGrid = () => setGrid(createEmptyGrid());

  const togglePower = () => {
    setPower(prev => !prev);
  };

  const handleBrightnessChange = (e) => {
    setBrightness(Number(e.target.value));
  };

  return (
    <div className="pixel-board-wrapper">
      <div className="pixel-board">
        {grid.map((row, rowIdx) => row.map((cell, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            className="pixel"
            data-rc={`${rowIdx}-${colIdx}`}
            style={{ backgroundColor: cell }}
            onMouseDown={() => {
              setDrawMode(grid[rowIdx][colIdx] === selectedColor ? 'erase' : 'draw');
              updatePixel(rowIdx, colIdx);
            }}
            onMouseEnter={(e) => isDrawing && e.buttons === 1 && updatePixel(rowIdx, colIdx)}
            onTouchStart={() => {
              setDrawMode(grid[rowIdx][colIdx] === selectedColor ? 'erase' : 'draw');
              updatePixel(rowIdx, colIdx);
            }}
            onTouchMove={handleTouchMove}
          />
        )))}
      </div>

      <div className="controls">
        <button className="reset-button" onClick={resetGrid}>Reset Grid</button>

        <div style={{ marginTop: '1rem' }}>
          <label>
            Brightness:
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={brightness}
              onChange={handleBrightnessChange}
              style={{ marginLeft: "10px" }}
            />
            <span style={{ marginLeft: "10px" }}>{brightness}%</span>
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={togglePower}>
            {power ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PixelBoard;

import React, { useState, useEffect } from 'react';
import './PixelBoard.css';

const SIZE = 8;

function PixelBoard({ onGridChange, selectedColor }) {
  const emptyGrid = () =>
    Array(SIZE).fill(null).map(() => Array(SIZE).fill('#000000')); // Default to black

  const [grid, setGrid] = useState(emptyGrid());

  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const setPixelColor = (rowIdx, colIdx) => {
    const currentColor = grid[rowIdx][colIdx];
    const newColor = currentColor === selectedColor ? '#000000' : selectedColor;
    
    const updated = grid.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? newColor : cell))
    );
    setGrid(updated);
  };

  const resetGrid = () => {
    setGrid(emptyGrid());
  };

  return (
    <div className="pixel-board-wrapper">
      <div className="pixel-board">
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className="pixel"
              style={{ backgroundColor: cell }}
              onClick={() => setPixelColor(rowIdx, colIdx)}
            />
          ))
        )}
      </div>
      <button className="reset-button" onClick={resetGrid}>Reset Grid</button>
    </div>
  );
}

export default PixelBoard;
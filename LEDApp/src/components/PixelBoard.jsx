import React, { useState, useEffect } from 'react';
import './PixelBoard.css';

const SIZE = 8;

function PixelBoard({ onGridChange }) {
  const emptyGrid = () =>
    Array(SIZE).fill(null).map(() => Array(SIZE).fill(false));

  const [grid, setGrid] = useState(emptyGrid());

  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const togglePixel = (rowIdx, colIdx) => {
    const updated = grid.map((row, r) =>
      row.map((cell, c) => (r === rowIdx && c === colIdx ? !cell : cell))
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
              className={`pixel ${cell ? 'on' : 'off'}`}
              onClick={() => togglePixel(rowIdx, colIdx)}
            />
          ))
        )}
      </div>
      <button className="reset-button" onClick={resetGrid}>Reset Grid</button>
    </div>
  );
}

export default PixelBoard;
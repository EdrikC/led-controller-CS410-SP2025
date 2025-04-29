import React, { useState, useEffect, useRef } from 'react';
import './PixelBoard.css';

const SIZE = 8;
const DEFAULT_COLOR = '#000000';

const Pixel = React.memo(({ color, rowIdx, colIdx, onTouchStart, onTouchMove }) => (
  <div
    className="pixel"
    style={{ backgroundColor: color }}
    data-rc={`${rowIdx}-${colIdx}`}
    onTouchStart={(e) => onTouchStart(rowIdx, colIdx, e)}
    onTouchMove={(e) => onTouchMove(rowIdx, colIdx, e)}
  />
));

function PixelBoard({ onGridChange, selectedColor, initialGrid }) {
  const boardRef = useRef(null);
  const [grid, setGrid] = useState(initialGrid || createEmptyGrid());
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('draw');
  const [brightness, setBrightness] = useState(100);

  function createEmptyGrid() {
    return Array(SIZE).fill().map(() => Array(SIZE).fill(DEFAULT_COLOR));
  }

  useEffect(() => {
    if (initialGrid?.length === SIZE) {
      setGrid(initialGrid);
    }
  }, [initialGrid]);

  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const handleTouchStart = (rowIdx, colIdx, e) => {
    e.preventDefault();
    const currentColor = grid[rowIdx][colIdx];

    if (currentColor.toLowerCase() === selectedColor.toLowerCase()) {
      setDrawMode('erase');
    } else {
      setDrawMode('draw');
    }

    updatePixel(rowIdx, colIdx);
    setIsDrawing(true);
  };

  const handleTouchMove = (rowIdx, colIdx, e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.dataset.rc) {
      const [r, c] = element.dataset.rc.split('-').map(Number);
      updatePixel(r, c);
    }
  };

  const updatePixel = (rowIdx, colIdx) => {
    setGrid((prev) =>
      prev.map((row, r) =>
        row.map((cell, c) => {
          if (r === rowIdx && c === colIdx) {
            return drawMode === 'draw' ? selectedColor : DEFAULT_COLOR;
          }
          return cell;
        })
      )
    );
  };

  const resetGrid = () => setGrid(createEmptyGrid());

  const increaseBrightness = () => setBrightness((b) => Math.min(100, b + 5));
  const decreaseBrightness = () => setBrightness((b) => Math.max(0, b - 5));

  return (
    <div className="pixel-board-wrapper">
      <div className="pixel-board" ref={boardRef}>
        {grid.map((row, rowIdx) =>
          row.map((color, colIdx) => (
            <Pixel
              key={`${rowIdx}-${colIdx}`}
              color={color}
              rowIdx={rowIdx}
              colIdx={colIdx}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            />
          ))
        )}
      </div>

      <div className="controls">
        <button onClick={resetGrid}>Reset Grid</button>

        <label style={{ marginTop: "10px" }}>
          Brightness:
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={{ marginLeft: "10px" }}
          />
          <span style={{ marginLeft: "10px" }}>{brightness}%</span>
        </label>
      </div>
    </div>
  );
}

export default PixelBoard;

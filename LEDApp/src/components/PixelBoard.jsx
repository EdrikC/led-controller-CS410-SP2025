import React, { useState, useEffect, useCallback } from 'react';
import './PixelBoard.css';

const SIZE = 8;
const DEFAULT_COLOR = '#000000';

// Memoized Pixel component
const Pixel = React.memo(({ color, onTouchStart, onMouseDown }) => (
  <div
    className="pixel"
    style={{ backgroundColor: color }}
    onTouchStart={onTouchStart}
    onMouseDown={onMouseDown}
  />
));

function PixelBoard({ onGridChange, selectedColor, initialGrid }) {
  const createEmptyGrid = () =>
    Array(SIZE).fill(null).map(() => Array(SIZE).fill(DEFAULT_COLOR));

  const [grid, setGrid] = useState(initialGrid || createEmptyGrid());
  const [pendingUpdates, setPendingUpdates] = useState(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('draw');

  useEffect(() => {
    const preventDefaultTouch = (e) => {
      if (e.target.closest('.pixel-board')) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefaultTouch);
  }, []);

  useEffect(() => {
    const handleEnd = () => {
      if (pendingUpdates.size > 0) {
        applyPendingUpdates();
      }
      setIsDrawing(false);
      setPendingUpdates(new Set());
    };

    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [pendingUpdates]);

  useEffect(() => {
    if (initialGrid?.length === SIZE) {
      setGrid(initialGrid);
    }
  }, [initialGrid]);

  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const applyPendingUpdates = () => {
    setGrid(prev =>
      prev.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          if (pendingUpdates.has(key)) {
            const shouldDraw = drawMode === 'draw' && cell !== selectedColor;
            const shouldErase = drawMode === 'erase' && cell !== DEFAULT_COLOR;
            return shouldDraw ? selectedColor : shouldErase ? DEFAULT_COLOR : cell;
          }
          return cell;
        })
      )
    );
  };

  const handlePixelAction = (rowIdx, colIdx) => {
    const key = `${rowIdx}-${colIdx}`;
    setPendingUpdates(prev => new Set(prev).add(key));

    if (!isDrawing) {
      setDrawMode(grid[rowIdx][colIdx] === selectedColor ? 'erase' : 'draw');
    }

    setIsDrawing(true);
  };

  const resetGrid = () => setGrid(createEmptyGrid());

  return (
    <div className="pixel-board-wrapper">
      <div className="pixel-board">
        {grid.map((row, rowIdx) =>
          row.map((color, colIdx) => (
            <Pixel
              key={`${rowIdx}-${colIdx}`}
              color={color}
              onTouchStart={() => handlePixelAction(rowIdx, colIdx)}
              onMouseDown={() => handlePixelAction(rowIdx, colIdx)}
            />
          ))
        )}
      </div>
      <button className="reset-button" onClick={resetGrid}>Reset Grid</button>
    </div>
  );
}

export default PixelBoard;

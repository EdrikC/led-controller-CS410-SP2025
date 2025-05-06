import React, { useState, useEffect, useRef } from 'react';
import './PixelBoard.css';
import { getActiveLEDCoordinates } from './LEDCoordFunction';

const SIZE = 8;
const DEFAULT_COLOR = '#000000';

function PixelBoard({ onGridChange = () => {}, selectedColor = '#FFFFFF', initialGrid }) {
  const createEmptyGrid = () => Array(SIZE).fill().map(() => Array(SIZE).fill(DEFAULT_COLOR));

  const [grid, setGrid] = useState(() => initialGrid?.length === SIZE ? initialGrid : createEmptyGrid());
  const [isDrawing, setIsDrawing] = useState(false);
  const drawModeRef = useRef('draw');
  const touchedRef = useRef(new Set());
  const boardRef = useRef(null);
  const activePointerRef = useRef(null);
  const [brightness, setBrightness] = useState(100);
  const [power, setPower] = useState(true);
  const [lastLoggedCoords, setLastLoggedCoords] = useState('');

  

  // Prevent default touch behaviors
  useEffect(() => {
    const preventDefaultTouch = e => {
      if (e.target.closest('.pixel-board')) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefaultTouch);
  }, []);

  // End drawing on pointerup and clear state
  useEffect(() => {
    const endGesture = () => {
      setIsDrawing(false);
      touchedRef.current.clear();
      if (boardRef.current && activePointerRef.current != null) {
        boardRef.current.releasePointerCapture(activePointerRef.current);
        activePointerRef.current = null;
      }
    };
    window.addEventListener('pointerup', endGesture);
    return () => window.removeEventListener('pointerup', endGesture);
  }, []);

  // Notify parent of grid changes
  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const updatePixel = (row, col, mode) => {
    const key = `${row}-${col}`;
    if (touchedRef.current.has(key)) return;

    const current = grid[row][col];
    const target = mode === 'draw'
      ? (current === selectedColor ? current : selectedColor)
      : (current === DEFAULT_COLOR ? current : DEFAULT_COLOR);

    if (target === current) {
      touchedRef.current.add(key);
      return;
    }

    setGrid(prev => {
      const copy = prev.map(r => [...r]);
      copy[row][col] = target;
      return copy;
    });
    touchedRef.current.add(key);
  };

  const startDraw = (row, col) => {
    drawModeRef.current = grid[row][col] === selectedColor ? 'erase' : 'draw';
    touchedRef.current.clear();
    setIsDrawing(true);
    updatePixel(row, col, drawModeRef.current);
  };

  const handlePointerMove = e => {
    if (!isDrawing || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixelSize = rect.width / SIZE;
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);
    if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
      updatePixel(row, col, drawModeRef.current);
    }
  };

  const handleLogCoordinates = () => {
    const currentCoords = getActiveLEDCoordinates(grid);
    if (currentCoords !== lastLoggedCoords) {
      console.log('Logging new coordinates');
      setLastLoggedCoords(currentCoords);
      // I WILL SEND TO BT HERE
    } else {
      console.log('Coordinates unchanged, not logging');
    }
  };

  // Use this effect to automatically log coordinates when the grid changes
  useEffect(() => {
    handleLogCoordinates();
  }, [grid]);


  return (
    <div className="pixel-board-wrapper">
      <div
        className="pixel-board"
        ref={boardRef}
        onPointerDown={e => {
          e.preventDefault();
          activePointerRef.current = e.pointerId;
          const rect = boardRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const pixelSize = rect.width / SIZE;
          const col = Math.floor(x / pixelSize);
          const row = Math.floor(y / pixelSize);
          if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
            startDraw(row, col);
            boardRef.current.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={handlePointerMove}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="pixel"
              style={{ backgroundColor: cell }}
            />
          ))
        )}
      </div>

      <div className="controls">
        <button onClick={() => setGrid(createEmptyGrid())}>Reset Grid</button>
        <div style={{ marginTop: '1rem' }}>
          <label>
            Brightness:
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={brightness}
              onChange={e => setBrightness(+e.target.value)}
              style={{ marginLeft: '10px' }}
            />
            <span style={{ marginLeft: '10px' }}>{brightness}%</span>
          </label>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => setPower(p => !p)}>{power ? 'Turn OFF' : 'Turn ON'}</button>
        </div>

        
        <div style={{ marginTop: '1rem' }}>
          {/* <button onClick={getActiveLEDCoordinates(grid)}>Log ON Coordinates</button> */}
        </div>
      </div>
    </div>
  );
}

export default PixelBoard;

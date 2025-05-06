import React, { useState, useEffect, useRef } from 'react';
import './PixelBoard.css';
// sendTestValue will be passed as a prop (onSendData)

const SIZE = 8;
const DEFAULT_COLOR = '#000000';

function PixelBoard({
  onGridChange = () => {},
  selectedColor = '#FFFFFF',
  initialGrid,
  onSendData, // This prop will be our function to send data
  onSendCoordinate
}) {
  const createEmptyGrid = () => Array(SIZE).fill().map(() => Array(SIZE).fill(DEFAULT_COLOR));
  const [grid, setGrid] = useState(() => initialGrid?.length === SIZE ? initialGrid : createEmptyGrid());
  const [isDrawing, setIsDrawing] = useState(false);
  const drawModeRef = useRef('draw');
  const touchedRef = useRef(new Set());
  const boardRef = useRef(null);
  const activePointerRef = useRef(null);
  const [brightness, setBrightness] = useState(100);
  const [power, setPower] = useState(true);

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

  // Notify parent of grid changes (this is fine to keep for other potential uses)
  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);

  const updatePixel = (row, col, mode) => {
    const key = `${row}-${col}`;
    if (touchedRef.current.has(key) && isDrawing) return; // Only skip if currently drawing and already touched in this stroke

    const current = grid[row][col];
    const target = mode === 'draw'
      ? (current === selectedColor ? current : selectedColor)
      : (current === DEFAULT_COLOR ? current : DEFAULT_COLOR);

    // Only proceed and send if the color is actually changing
    if (target !== current) {
      setGrid(prev => {
        const copy = prev.map(r => [...r]);
        copy[row][col] = target;
        return copy;
      });

      // Send the updated coordinate
      const coordString = JSON.stringify([row + 1, col + 1]);
      if (onSendCoordinate) {
        onSendCoordinate(coordString);
      }

      // --- SEND THE SINGLE CLICKED/MODIFIED COORDINATE ---
      const clickedCoordString = JSON.stringify([row + 1, col + 1]); // Format as [r+1, c+1]
      console.log('PixelBoard: Clicked coordinate to send:', clickedCoordString);
      if (onSendData) {
        onSendData(clickedCoordString); // Send the single clicked coordinate string
      } else {
        console.warn("PixelBoard: onSendData function not provided. Cannot send clicked coordinate.");
      }
      // ----------------------------------------------------
    }
    touchedRef.current.add(key);
  };

  const startDraw = (row, col) => {
    // Determine if this initial click is a draw or erase action
    const initialPixelIsSelectedColor = grid[row][col] === selectedColor;
    const initialPixelIsDefaultColor = grid[row][col] === DEFAULT_COLOR;

    if (initialPixelIsSelectedColor) {
        drawModeRef.current = 'erase'; // If clicking on selected color, start erasing
    } else if (initialPixelIsDefaultColor || grid[row][col] !== selectedColor) {
        drawModeRef.current = 'draw'; // If clicking on default or other color, start drawing
    }
    // No else needed, drawModeRef.current keeps its last value if it's a no-op click for starting

    touchedRef.current.clear(); // Clear for a new drawing stroke
    setIsDrawing(true);
    updatePixel(row, col, drawModeRef.current); // This will handle the first pixel update and send
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
      updatePixel(row, col, drawModeRef.current); // drawModeRef.current is set in startDraw
    }
  };



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
            startDraw(row, col); // This now triggers the first updatePixel and send
            if (boardRef.current) { // Check if boardRef.current is still valid
              boardRef.current.setPointerCapture(e.pointerId);
            }
          }
        }}
        onPointerMove={handlePointerMove}
      >
        {grid.map((rowArr, r) =>
          rowArr.map((cell, c) => (
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
      </div>
    </div>
  );
}

export default PixelBoard;
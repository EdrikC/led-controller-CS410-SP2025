import React, { useState, useEffect, useRef } from 'react';
import './PixelBoard.css';

const SIZE = 8;
const DEFAULT_COLOR = '#000000';

function PixelBoard({ onGridChange, selectedColor, initialGrid }) {
  const createEmptyGrid = () =>
    Array(SIZE).fill().map(() => Array(SIZE).fill(DEFAULT_COLOR));

  const [grid, setGrid] = useState(initialGrid || createEmptyGrid());
  const [isDrawing, setIsDrawing] = useState(false);

  const drawModeRef = useRef('draw');
  const [brightness, setBrightness] = useState(100);
  const [power, setPower] = useState(true);


  useEffect(() => {
    const preventDefaultTouch = (e) => {
      if (e.target.closest('.pixel-board')) e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefaultTouch);
  }, []);


  useEffect(() => {
    const endGesture = () => {
      console.log('gesture end');
      setIsDrawing(false);
    };
    window.addEventListener('mouseup', endGesture);
    window.addEventListener('touchend', endGesture);
    return () => {
      window.removeEventListener('mouseup', endGesture);
      window.removeEventListener('touchend', endGesture);
    };
  }, []);


  useEffect(() => {
    if (initialGrid?.length === SIZE) setGrid(initialGrid);
  }, [initialGrid]);


  useEffect(() => {
    onGridChange(grid);
  }, [grid, onGridChange]);


  const updatePixel = (row, col, mode) => {
    const current = grid[row][col];
    const target =
      mode === 'draw'
        ? current === selectedColor
          ? current
          : selectedColor
        : current === DEFAULT_COLOR
        ? current
        : DEFAULT_COLOR;

    if (target === current) {
      console.log(`— skip [${row},${col}] (no change)`);
      return;
    }

    console.log(`⏺ ${mode} at [${row},${col}] → ${target}`);
    setGrid((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[row][col] = target;
      return copy;
    });
  };

  // Handle touchmove only when drawing
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const hit = document.elementFromPoint(touch.clientX, touch.clientY);
    if (hit?.classList.contains('pixel')) {
      const [r, c] = hit.dataset.rc.split('-').map(Number);
      updatePixel(r, c, drawModeRef.current);
    }
  };

  // Start a draw/erase gesture
  const startDraw = (r, c) => {
    const mode = grid[r][c] === selectedColor ? 'erase' : 'draw';
    drawModeRef.current = mode;
    console.log(`startDraw at [${r},${c}] mode=${mode}`);
    updatePixel(r, c, mode);
    setIsDrawing(true);
  };

  return (
    <div className="pixel-board-wrapper">
      <div className="pixel-board">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="pixel"
              data-rc={`${r}-${c}`}
              style={{ backgroundColor: cell }}
              onMouseDown={() => startDraw(r, c)}
              onMouseEnter={(e) => isDrawing && e.buttons === 1 && updatePixel(r, c, drawModeRef.current)}
              onTouchStart={() => startDraw(r, c)}
              onTouchMove={handleTouchMove}
            />
          ))
        )}
      </div>

      <div className="controls">
        <button
          onClick={() => {
            console.log('reset');
            setGrid(createEmptyGrid());
          }}
        >
          Reset Grid
        </button>

        <div style={{ marginTop: '1rem' }}>
          <label>
            Brightness:
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={brightness}
              onChange={(e) => {
                console.log(`${e.target.value}%`);
                setBrightness(Number(e.target.value));
              }}
              style={{ marginLeft: '10px' }}
            />
            <span style={{ marginLeft: '10px' }}>{brightness}%</span>
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => {
              console.log(`power → ${!power}`);
              setPower((p) => !p);
            }}
          >
            {power ? 'Turn OFF' : 'Turn ON'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PixelBoard;
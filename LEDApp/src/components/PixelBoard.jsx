import React, { useState, useEffect, useRef } from 'react';
import './PixelBoard.css'; // Make sure this CSS file exists

const SIZE = 8;
const DEFAULT_COLOR = '#000000'; // Black

// Add onPixelClick prop
function PixelBoard({ onGridChange = () => {}, selectedColor = '#FFFFFF', initialGrid, onPixelClick, onResetClick}) {
  const createEmptyGrid = () => Array(SIZE).fill().map(() => Array(SIZE).fill(DEFAULT_COLOR));

  const [grid, setGrid] = useState(() => initialGrid?.length === SIZE && initialGrid[0]?.length === SIZE ? initialGrid : createEmptyGrid());
  const [isDrawing, setIsDrawing] = useState(false);
  const drawModeRef = useRef('draw'); // 'draw' or 'erase'
  const touchedRef = useRef(new Set()); // To track pixels touched during a single gesture
  const boardRef = useRef(null);
  const activePointerRef = useRef(null); // To track the active pointer ID for multi-touch
  const [brightness, setBrightness] = useState(100); // State for brightness control
  const [power, setPower] = useState(true); // State for power control



  // Prevent default touch behaviors (like scrolling)
  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const preventDefaultTouch = e => {
       // Only prevent default on pointerdown/move *within* the board
       // and only if we are actively drawing or capturing the pointer
       if (isDrawing && activePointerRef.current !== null && e.pointerId === activePointerRef.current) {
           e.preventDefault();
       }
       // Or a simpler check: if the target is a pixel
       if (e.target.classList.contains('pixel')) {
            e.preventDefault();
       }
    };

    // Use passive: false to allow preventDefault
    boardElement.addEventListener('pointerdown', preventDefaultTouch, { passive: false });
    boardElement.addEventListener('pointermove', preventDefaultTouch, { passive: false });
    // It's often sufficient to prevent touchmove on the document or body
     document.body.style.overscrollBehaviorY = 'none'; // Helps prevent pull-to-refresh

    return () => {
        boardElement.removeEventListener('pointerdown', preventDefaultTouch);
        boardElement.removeEventListener('pointermove', preventDefaultTouch);
        document.body.style.overscrollBehaviorY = 'auto'; // Restore default
    };
  }, [isDrawing]); // Re-run if drawing state changes? Maybe not necessary


  // End drawing on pointerup and clear state
  useEffect(() => {
    const endGesture = () => {
      // Only end gesture if we were drawing with the active pointer
      if (isDrawing && activePointerRef.current != null) {

         if (boardRef.current && activePointerRef.current != null) {
            try {
             // Check if capture was actually set before releasing
             boardRef.current.releasePointerCapture(activePointerRef.current);
            } catch (e) {
               // Handle error if pointer capture wasn't set or already released
               console.warn("Failed to release pointer capture:", e);
            }
            activePointerRef.current = null;
         }
      }
       setIsDrawing(false); // Ensure drawing state is reset
       touchedRef.current.clear(); // Clear touched pixels for the next interaction
    };
    // Listen on window to catch pointerups outside the board
    window.addEventListener('pointerup', endGesture);
    window.addEventListener('pointercancel', endGesture); // Handle gestures being cancelled

    return () => {
      window.removeEventListener('pointerup', endGesture);
      window.removeEventListener('pointercancel', endGesture);
    };
  }, [isDrawing]); // Add isDrawing as a dependency if logic inside relies on its latest value

  // Notify parent of grid changes
  useEffect(() => {

    onGridChange(grid);
  }, [grid, onGridChange]);


  // Helper function to update a single pixel color
  const updatePixel = (row, col, mode) => {
    const key = `${row}-${col}`;
    // Prevent processing the same pixel multiple times in a single gesture
    if (touchedRef.current.has(key)) return;

    const current = grid[row][col];
    // Determine the target color based on draw mode ('draw' uses selected, 'erase' uses default)
    const target = mode === 'draw'
      ? (current === selectedColor ? current : selectedColor)
      : (current === DEFAULT_COLOR ? current : DEFAULT_COLOR);

     // If target is the same as current, no change needed for the grid state
    if (target === current) {
       touchedRef.current.add(key); // Still mark as touched to prevent redundant checks in a drag
       // console.log(`Pixel ${row},${col} already has color ${current}, mode ${mode}`);
       return;
    }

    // If target is different, update the grid state
    setGrid(prev => {
      const copy = prev.map(r => [...r]);
      copy[row][col] = target;
      return copy;
    });

    // Mark the pixel as touched for this gesture
    touchedRef.current.add(key);
    // console.log(`Pixel ${row},${col} color changed from ${current} to ${target}`);

     // This fires on the first touch that changes a pixel's color in a gesture.
     // If the user is dragging, it will fire for the first pixel touched in the drag.
     if (typeof onPixelClick === 'function') {
         // Use 1-based indexing for row and column
         const row1based = row + 1;
         const col1based = col + 1;
         console.log(`Clicked pixel: (${row1based}, ${col1based})`);
         onPixelClick(row1based, col1based); // Pass 1-based coordinates
     }
  };

  // Called on pointerdown on a pixel
  const startDraw = (row, col) => {
    // Determine draw mode based on the *initial* pixel color
    drawModeRef.current = grid[row][col] === selectedColor ? 'erase' : 'draw';
    touchedRef.current.clear(); // Clear touched pixels from previous gesture
    setIsDrawing(true); // Indicate a drawing/interacting gesture has started

    // Update the initial pixel
    updatePixel(row, col, drawModeRef.current);
  };

  // Called on pointermove within the board while isDrawing is true
  const handlePointerMove = e => {
    // Only process if drawing is active and it's the active pointer
    if (!isDrawing || !boardRef.current || e.pointerId !== activePointerRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixelSize = rect.width / SIZE;
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);

    // Ensure coordinates are within bounds
    if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
      // Update the pixel using the determined mode from startDraw
      updatePixel(row, col, drawModeRef.current);
    }
  };

  // Combines calling reset grid and clearing the local state
  const resetGrid = () => {
    setGrid(createEmptyGrid());
    onResetClick();
  };

  return (
    <div>
      <div
        className="pixel-board"
        ref={boardRef}
        onPointerDown={e => {
          e.preventDefault(); // Prevent default browser actions like selection/dragging
          // Only start gesture if no active pointer is being tracked (for multi-touch scenarios)
          if (activePointerRef.current !== null) return;

          activePointerRef.current = e.pointerId; // Track this pointer ID

          const rect = boardRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const pixelSize = rect.width / SIZE;
          const col = Math.floor(x / pixelSize);
          const row = Math.floor(y / pixelSize);

          // Ensure coordinates are within bounds before starting interaction
          if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
            startDraw(row, col); // Initiate the draw/erase gesture
            // Capture the pointer to receive events even if it leaves the board
            if (boardRef.current) {
               boardRef.current.setPointerCapture(e.pointerId);
            }
          }
        }}
        onPointerMove={handlePointerMove} // Handle drag movements
        // pointerUp is handled by the window listener
        // pointerCancel is handled by the window listener
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            // Pointer events are handled by the parent .pixel-board div for dragging logic
            // Individual pixel divs just need the key and background color
            <div
              key={`${r}-${c}`}
              className="pixel"
              style={{ backgroundColor: cell }}
              // We can optionally add onClick here for simple clicks that *don't* drag
              // But the current onPointerDown/Move/Up logic covers both click and drag.
              // The onPixelClick call is placed in updatePixel which fires for the first touch.
            />
          ))
        )}
      </div>

      {/* Controls (Optional - depends if controls are part of this component or a parent) */}
      <div className="controls">
        <button onClick={() => resetGrid()}>Reset Grid</button>

        {/* Brightness Control */}
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

        {/* Power Control */}
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => setPower(p => !p)}>{power ? 'Turn OFF' : 'Turn ON'}</button>
        </div>

         {/* Removed the Log button as sending is now automatic */}
         {/*
        <div style={{ marginTop: '1rem' }}>
          <button onClick={getActiveLEDCoordinates}>Log ON Coordinates</button>
        </div>
         */}
      </div>
    </div>
  );
}

export default PixelBoard;
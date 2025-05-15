import React from 'react';
import './ColorPicker.css';

/**
 * ColorPicker Component
 *
 * Renders a list of preset color options and a color wheel input.
 * Allows the user to select an LED color for use in the LED grid.
 *
 * @param {function} onColorChange - Callback to update selected color
 * @param {string} selectedColor - The currently selected color (hex string)
 */
function ColorPicker({ onColorChange, selectedColor }) {
  // List of predefined color swatches
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', 
    '#FFFFFF', '#000000', 
  ];

  return (
    <div className="color-picker">
     <span>LED Color</span>
      {colors.map((color) => (
        <div
          key={color}
          className={`color-option ${selectedColor === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onColorChange(color)}
        />
      ))}
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => onColorChange(e.target.value)}
        className="color-wheel"
      />
    </div>
  );
}

export default ColorPicker;
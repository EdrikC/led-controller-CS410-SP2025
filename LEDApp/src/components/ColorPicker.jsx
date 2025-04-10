import React from 'react';
import './ColorPicker.css';

function ColorPicker({ onColorChange, selectedColor }) {
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', 
    '#FFFFFF', '#000000', 
  ];

  return (
    <div className="color-picker">
     <span>Pick Light Color</span>
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
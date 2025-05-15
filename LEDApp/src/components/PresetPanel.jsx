import React, { useState, useEffect } from 'react';

import './PresetPanel.css'; 

/**
 * PresetPanel Component
 *
 * Manages saving, loading, and deleting LED grid presets using localStorage.
 *
 * @param {Array<Array<string>>} gridData - Current LED grid state
 * @param {function} setGridData - Setter to update the LED grid with a selected preset
 */
function PresetPanel({ gridData, setGridData }) {
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');

  // Load presets from localStorage when the component mounts
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('led-presets')) || [];
    setPresets(saved);
  }, []);

  // Save a new preset with a unique name
  const savePreset = () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) return;

    // Check for duplicate name (case-insensitive)
    const nameExists = presets.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
  
    if (nameExists) {
      alert("Preset name already exists. Please choose a different name.");
      return;
    }
    // Save new preset
    const newPreset = { name: trimmedName, data: gridData };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('led-presets', JSON.stringify(updated));
    setPresetName('');
  };
  // Load a selected preset into the grid
  const loadPreset = (preset) => {
    setGridData(preset.data);
  };
  
  // Delete a preset by index
  const deletePreset = (index) => {
    const updated = [...presets];
    updated.splice(index, 1);
    setPresets(updated);
    localStorage.setItem('led-presets', JSON.stringify(updated));
  };

  return (
    <div className="presets-panel">
      <h2>Presets</h2>

      <input
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
        placeholder="Enter preset name"
      />

      <button onClick={savePreset}>Save Preset</button>

      <ul>
        {presets.map((preset, index) => (
          <li key={index}>
            <span>{preset.name}</span>
            <button onClick={() => loadPreset(preset)}>Load</button>
            <button onClick={() => deletePreset(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PresetPanel;

import React, { useState, useEffect, useRef } from 'react';

export const getActiveLEDCoordinates = (grid) => {
    const SIZE = 8;
    const DEFAULT_COLOR = '#000000';
    let coords = "";
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== DEFAULT_COLOR) {
           // Create a string for this single coordinate
        const coordString = JSON.stringify([r + 1, c + 1]);
        coords = coordString;
        }
      }
    }
  
    // const coordString = JSON.stringify(coords);
    console.log('ON LED Coordinates (UTF-8 string):', coords);
    return coords;
  };
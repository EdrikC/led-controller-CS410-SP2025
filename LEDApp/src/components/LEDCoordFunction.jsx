import React, { useState, useEffect, useRef } from 'react';

export const getActiveLEDCoordinates = (row, col) => {
  // Create a string for this single coordinate
  const coordString = JSON.stringify([row + 1, col + 1]);
  console.log(`ON LED Coordinate (UTF-8 string):`, coordString);
  return coordString;
};
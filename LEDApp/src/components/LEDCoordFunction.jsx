import React, { useState, useEffect, useRef } from 'react';

/**
 * Converts a 0-based (row, col) coordinate to a 1-based format
 * and returns it as a UTF-8 compatible JSON string.
 *
 * This is primarily used for logging or sending individual
 * LED coordinates in a format that is easy to parse.
 *
 * @param {number} row - The 0-based row index
 * @param {number} col - The 0-based column index
 * @returns {string} A JSON string like "[3, 5]" representing the LED position
 */
export const getActiveLEDCoordinates = (row, col) => {
  // Create a string for this single coordinate
  const coordString = JSON.stringify([row + 1, col + 1]);
  console.log(`ON LED Coordinate (UTF-8 string):`, coordString);
  return coordString;
};
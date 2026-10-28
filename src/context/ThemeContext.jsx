import React from 'react';

// Light mode is permanently locked across the entire website.
export const ThemeProvider = ({ children }) => children;
export const useTheme = () => ({ darkMode: false, toggleDarkMode: () => {} });

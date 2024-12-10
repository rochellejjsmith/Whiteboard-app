-- Create the database (only if not already created)
CREATE DATABASE IF NOT EXISTS drawingApp;

-- Select the database to use
USE drawingApp;

-- Create the drawing_events table
CREATE TABLE IF NOT EXISTS drawing_events (
  id INT AUTO_INCREMENT PRIMARY KEY,   -- Unique ID for each event
  x INT NOT NULL,                      -- X coordinate of the drawing point
  y INT NOT NULL,                      -- Y coordinate of the drawing point
  tool VARCHAR(255) NOT NULL,          -- Type of tool used (pencil, eraser, etc.)
  color VARCHAR(7) NOT NULL,           -- Color used for the drawing (hex code like "#000000")
  lineWidth INT NOT NULL,              -- Line width of the drawing
  globalAlpha FLOAT NOT NULL,          -- Opacity of the drawing (1.0 for full opacity)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Time when the event was recorded
);

-- Display all tables in the database
SHOW TABLES;

-- Select all data from the drawing_events table
SELECT * FROM drawing_events;

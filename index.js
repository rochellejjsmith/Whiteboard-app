// index.js
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const db = require('./db'); // Import the database connection
app.use(express.static('public'));

// Store drawing history in the database and provide a history endpoint
app.get('/history', (req, res) => {
  db.query('SELECT * FROM drawing_events', (err, results) => {
    if (err) {
      console.error('Error fetching drawing history:', err);
      res.status(500).send('Database error');
    } else {
      res.json(results);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(), 
    message: 'Server is healthy' 
  });
});

// Manage socket connections
let drawingHistory = []; // Store drawing events

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  // Send existing drawing history to the new client
  socket.emit('replay', drawingHistory);

  // Handle "draw" events
  socket.on('draw', (data) => {
    drawingHistory.push({ event: 'draw', data }); // Save draw event to history
    io.emit('ondraw', data); // Broadcast drawing to other clients
    
    // Save drawing event to the database
    db.query(
      'INSERT INTO drawing_events (x, y, tool, color, lineWidth, globalAlpha) VALUES (?, ?, ?, ?, ?, ?)', 
      [data.x, data.y, data.tool, data.color, data.lineWidth, data.globalAlpha],
      (err) => {
        if (err) console.error('Error saving drawing event:', err);
      }
    );
  });

  // Handle "down" events
  socket.on('down', (data) => {
    drawingHistory.push({ event: 'down', data });
    io.emit('ondown', data);
    
    // Save "down" event to the database
    db.query(
      'INSERT INTO drawing_events (x, y, tool, color, lineWidth, globalAlpha) VALUES (?, ?, ?, ?, ?, ?)', 
      [data.x, data.y, data.tool, data.color, data.lineWidth, data.globalAlpha],
      (err) => {
        if (err) console.error('Error saving "down" event:', err);
      }
    );
  });

  // Handle "clear" events
  socket.on('clear', () => {
    drawingHistory = []; // Clear drawing history
    io.emit('clear'); // Notify all clients to clear canvas
    
    // Clear drawing history from the database
    db.query('DELETE FROM drawing_events', (err) => {
      if (err) console.error('Error clearing drawing history:', err);
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const dynamoDb = require('./db'); // Import the DynamoDB DocumentClient

app.use(express.static('public'));

// DynamoDB Table Name
const TABLE_NAME = 'DrawingEvents';

// Store drawing history and provide a history endpoint
app.get('/history', async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };
    const result = await dynamoDb.scan(params).promise();
    res.json(result.Items); // Return all drawing events
  } catch (error) {
    console.error('Error fetching drawing history:', error);
    res.status(500).send('Database error');
  }
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
let drawingHistory = []; // Store drawing events in memory for live clients

io.on('connection', (socket) => {
  console.log(`${socket.id} connected`);

  // Send existing drawing history to the new client
  socket.emit('replay', drawingHistory);

  // Handle "draw" events
  socket.on('draw', async (data) => {
    drawingHistory.push({ event: 'draw', data }); // Save event to memory
    io.emit('ondraw', data); // Broadcast drawing to other clients

    // Save event to DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: `${Date.now()}-${Math.random()}`, // Unique ID for the event
        event: 'draw',
        ...data, // Include event data
      },
    };
    try {
      await dynamoDb.put(params).promise();
    } catch (error) {
      console.error('Error saving drawing event:', error);
    }
  });

  // Handle "down" events
  socket.on('down', async (data) => {
    drawingHistory.push({ event: 'down', data });
    io.emit('ondown', data);

    // Save "down" event to DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: {
        id: `${Date.now()}-${Math.random()}`,
        event: 'down',
        ...data,
      },
    };
    try {
      await dynamoDb.put(params).promise();
    } catch (error) {
      console.error('Error saving "down" event:', error);
    }
  });

  // Handle "clear" events
  socket.on('clear', async () => {
    drawingHistory = []; // Clear in-memory history
    io.emit('clear'); // Notify all clients to clear canvas

    // Delete all events from DynamoDB
    try {
      const scanParams = { TableName: TABLE_NAME };
      const scanResult = await dynamoDb.scan(scanParams).promise();
      const deleteRequests = scanResult.Items.map((item) => ({
        DeleteRequest: { Key: { id: item.id } },
      }));
      if (deleteRequests.length > 0) {
        const deleteParams = { RequestItems: { [TABLE_NAME]: deleteRequests } };
        await dynamoDb.batchWrite(deleteParams).promise();
      }
    } catch (error) {
      console.error('Error clearing drawing history:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`);
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

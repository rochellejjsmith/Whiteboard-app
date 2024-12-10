const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

app.use(express.static("public"));

let drawingHistory = []; // Store drawing events

// Health check endpoint
app.get("/health", (req, res) => {
   res.status(200).json({ status: "ok", uptime: process.uptime(), message: "Server is healthy" });
});

io.on("connection", (socket) => {
   console.log(`${socket.id} connected`);

   // Send existing drawing history to the new client
   socket.emit("replay", drawingHistory);

   // Handle "draw" events
   socket.on("draw", (data) => {
      drawingHistory.push({ event: "draw", data }); // Save draw event
      socket.broadcast.emit("ondraw", data);
   });

   // Handle "down" events
   socket.on("down", (data) => {
      drawingHistory.push({ event: "down", data }); // Save down event
      socket.broadcast.emit("ondown", data);
   });

   // Handle "clear" events
   socket.on("clear", () => {
      drawingHistory = []; // Clear history
      io.emit("clear"); // Notify all clients (including sender)
   });

   // Handle disconnection
   socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected`);
   });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

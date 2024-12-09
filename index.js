const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

app.use(express.static("public"));

io.on("connection", (socket) => {
   console.log(`${socket.id} connected`);

   // Broadcast drawing events
   socket.on("draw", (data) => {
      socket.broadcast.emit("ondraw", data);
   });

   // Broadcast "down" events
   socket.on("down", (data) => {
      socket.broadcast.emit("ondown", data);
   });

   // Broadcast canvas clear
   socket.on("clear", () => {
      socket.broadcast.emit("clear");
   });

   socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected`);
   });
});

const PORT = process.env.PORT || 80;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

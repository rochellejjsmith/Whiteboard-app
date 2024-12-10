const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const tools = document.querySelectorAll(".tool");
const socket = io.connect("http://localhost:8080/");

canvas.width = window.innerWidth * 0.8; // Center canvas
canvas.height = window.innerHeight * 0.8;

let drawing = false;
let x, y;
let currentTool = "pencil";
let currentColor = "#000000";

// Default drawing settings
ctx.strokeStyle = currentColor;
ctx.lineWidth = 2;
ctx.globalAlpha = 1; // Default opacity

// Tool selection logic
function setActiveTool(tool) {
   tools.forEach((btn) => btn.classList.remove("active"));
   tool.classList.add("active");

   currentTool = tool.dataset.tool;

   // Update color picker availability and lineWidth for the selected tool
   if (currentTool === "eraser") {
      colorPicker.disabled = true; // Disable color picker for eraser
      ctx.strokeStyle = "#ffffff"; // White color for eraser (it will erase)
      ctx.lineWidth = 10;
      ctx.globalAlpha = 1;
   } else {
      colorPicker.disabled = false; // Enable color picker for other tools
      ctx.strokeStyle = currentColor;
      switch (currentTool) {
         case "pencil":
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1;
            break;
         case "marker":
            ctx.lineWidth = 5;
            ctx.globalAlpha = 1;
            break;
         case "highlighter":
            ctx.lineWidth = 15;
            ctx.globalAlpha = 0.5; // Transparency for highlighter
            break;
      }
   }
}

// Event listeners for tool selection
tools.forEach((tool) => {
   tool.addEventListener("click", () => {
      setActiveTool(tool);
   });
});

// Update stroke color
colorPicker.addEventListener("input", (e) => {
   currentColor = e.target.value;
   if (currentTool !== "eraser") {
      ctx.strokeStyle = currentColor;
   }
});

// Begin drawing on canvas
canvas.onmousedown = (e) => {
   drawing = true;
   [x, y] = [e.offsetX, e.offsetY];
   ctx.beginPath(); // Start a new path when mousedown (prevents linking)
   ctx.moveTo(x, y); // Move to the mouse position

   socket.emit("down", {
      x,
      y,
      tool: currentTool,
      color: currentColor,
      lineWidth: ctx.lineWidth,
      globalAlpha: ctx.globalAlpha,
   });
};

// Stop drawing
canvas.onmouseup = () => {
   drawing = false;
   ctx.closePath(); // Close the path to avoid connecting strokes
};

// Handle mouse movement and draw
canvas.onmousemove = (e) => {
   if (!drawing) return;

   const newX = e.offsetX;
   const newY = e.offsetY;

   ctx.lineTo(newX, newY); // Continue drawing the path
   ctx.stroke();

   socket.emit("draw", {
      x: newX,
      y: newY,
      tool: currentTool,
      color: currentColor,
      lineWidth: ctx.lineWidth,
      globalAlpha: ctx.globalAlpha,
   });

   [x, y] = [newX, newY];
};

// Listen for "down" events from the server
socket.on("ondown", ({ x, y, tool, color, lineWidth, globalAlpha }) => {
   applyDrawingSettings(tool, color, lineWidth, globalAlpha);
   ctx.beginPath();  // Start a new path for each "down"
   ctx.moveTo(x, y);
});

// Listen for "draw" events from the server
socket.on("ondraw", ({ x, y, tool, color, lineWidth, globalAlpha }) => {
   applyDrawingSettings(tool, color, lineWidth, globalAlpha);
   ctx.lineTo(x, y);
   ctx.stroke();
});

// Apply specific drawing settings
function applyDrawingSettings(tool, color, lineWidth, globalAlpha) {
   if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff"; // White color for eraser
   } else {
      ctx.strokeStyle = color;
   }
   ctx.lineWidth = lineWidth;
   ctx.globalAlpha = globalAlpha;
}

// Listen for canvas clear events
socket.on("clear", () => {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
});

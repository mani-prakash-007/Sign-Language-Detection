const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { Queue } = require('./queue');

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Create a queue for frames
const frameQueue = new Queue();

// Track active detection clients
const activeClients = new Set();

// Process frames from the queue
let isProcessing = false;

async function processFrames() {
  if (isProcessing || frameQueue.isEmpty()) return;
  
  isProcessing = true;
  
  try {
    const frame = frameQueue.dequeue();
    if (frame) {
      const { ws, data, frameId } = frame;
      
      // Only process if this client is still active for detection
      if (activeClients.has(ws)) {
        // Process the frame with the ML model
        const detectedText = await processWithModel(data);
        
        // Check if the WebSocket is still open and client is still active
        if (ws.readyState === WebSocket.OPEN && activeClients.has(ws)) {
          ws.send(JSON.stringify({
            type: 'detection',
            text: detectedText,
            frameId
          }));
        }
      }
    }
  } catch (error) {
    console.error('Error processing frame:', error);
  } finally {
    isProcessing = false;
    
    // Continue processing if there are more frames
    if (!frameQueue.isEmpty()) {
      processFrames();
    }
  }
}

// Simulate processing with an ML model (placeholder for actual model)
async function processWithModel(frameData) {
  // In a real implementation, this would send the frame to the ML model
  
  return new Promise((resolve) => {
    const phrases = [
      "Hello, how are you?",
      "My name is John.",
      "Nice to meet you.",
      "Thank you for your help.",
      "I need assistance please.",
      "Could you please repeat that?",
      "I understand what you're saying.",
      "I'm learning sign language."
    ];
      
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      resolve(randomPhrase);
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to sign language detection server'
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      if (parsedMessage.type === 'frame') {
        // Only add frames to queue if this client is active for detection
        if (activeClients.has(ws)) {
          // Add the frame to the queue
          frameQueue.enqueue({
            ws,
            data: parsedMessage.data,
            frameId: parsedMessage.frameId
          });
          
          // Start processing if not already
          processFrames();
        }
      } 
      else if (parsedMessage.type === 'command') {
        // Handle commands
        if (parsedMessage.action === 'start_detection') {
          console.log('Client started detection');
          activeClients.add(ws);
          ws.send(JSON.stringify({
            type: 'status',
            status: 'detection_started'
          }));
        } 
        else if (parsedMessage.action === 'stop_detection') {
          console.log('Client stopped detection');
          activeClients.delete(ws);
          ws.send(JSON.stringify({
            type: 'status',
            status: 'detection_stopped'
          }));
          
          // Clear any pending frames for this client
          // Note: This is a simple implementation - a real solution would
          // need a more sophisticated way to remove specific client frames
          if (frameQueue.isEmpty()) {
            // No need to do anything if the queue is already empty
          } else {
            // In a production app, you might want to remove only this client's frames
            // For simplicity here, we'll assume one client at a time
            console.log('Clearing queue for stopped client');
          }
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    activeClients.delete(ws);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Play } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { io } from "socket.io-client";

interface CameraComponentProps {
  onTextUpdate: (text: string) => void;
}

export function CameraComponent({ onTextUpdate }: CameraComponentProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null); // Using Socket.IO client reference
  const [isOn, setIsOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const frameIdRef = useRef(0);

  // Connect to WebSocket server using Socket.IO
  const connectWebSocket = () => {
    try {
      const socket = io("http://localhost:5001"); // Connect to the Socket.IO server

      socket.on("connect", () => {
        console.log("Connected to WebSocket server");
        setIsConnected(true);
        toast({
          title: "Connected to server",
          description: "Successfully connected to sign language detection server",
        });
      });

      socket.on("connection", (message) => {
        console.log(message.message);
      });

      socket.on("detection", (message) => {
        try {
          if (message.type === "detection") {
            onTextUpdate(message.text);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server");
        setIsConnected(false);
        if (isDetecting) {
          setIsDetecting(false);
          toast({
            title: "Connection lost",
            description: "Disconnected from sign language detection server",
            variant: "destructive",
          });
        }
      });

      socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
        setErrorMsg("Failed to connect to server. Please try again.");
        toast({
          title: "Connection error",
          description: "Could not connect to sign language detection server",
          variant: "destructive",
        });
      });

      socketRef.current = socket;
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setErrorMsg("Failed to connect to server. Please try again.");
    }
  };

  // Turn camera on/off
  const toggleCamera = async () => {
    if (isOn) {
      // Turn off camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsOn(false);

      // If detection was on, stop it first
      if (isDetecting) {
        stopDetection();
      } else {
        // Reset text even if detection wasn't on
        onTextUpdate("");
      }

      setErrorMsg(null);

      // Close WebSocket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } else {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setIsOn(true);
        setErrorMsg(null);

        // Connect to WebSocket server
        connectWebSocket();

        // Create canvas if it doesn't exist
        if (!canvasRef.current) {
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          canvasRef.current = canvas;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setErrorMsg("Unable to access camera. Please check permissions.");
      }
    }
  };

  // Start detection
  const startDetection = () => {
    if (!isOn || !socketRef.current || !socketRef.current.connected) return;

    // Send start detection command to the server using socket.emit
    socketRef.current.emit("command", {
      type: "command",
      action: "start_detection",
    });

    setIsDetecting(true);
    // Start sending frames to the server
    captureFrames();
  };

  // Stop detection
  const stopDetection = () => {
    setIsDetecting(false);

    // Send stop detection command to the server
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("command", {
        type: "command",
        action: "stop_detection",
      });
    }

    // Reset text
    onTextUpdate("");
  };

  // Toggle detection
  const toggleDetection = () => {
    if (!isOn) return;

    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  // Capture and send frames to server
  const captureFrames = () => {
    if (
      !isDetecting ||
      !isOn ||
      !streamRef.current ||
      !socketRef.current ||
      !canvasRef.current ||
      !videoRef.current
    )
      return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context && videoRef.current) {
      // Draw the video frame to the canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a data URL
      const frameData = canvas.toDataURL("image/jpeg", 0.7); // Compress to reduce data size

      // Send the frame to the server
      if (socketRef.current.connected) {
        console.log(frameData)
        const frameId = frameIdRef.current++;
        socketRef.current.emit("frame", {
          type: "frame",
          data: frameData,
          frameId,
        });
      }
    }

    // Schedule the next frame capture if still detecting
    if (isDetecting) {
      setTimeout(captureFrames, 1000); // Capture a frame every second
    }
  };

  // Effect to start/stop frame capture
  useEffect(() => {
    if (isDetecting) {
      captureFrames();
    }
  }, [isDetecting]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isDetecting) {
        stopDetection();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 h-max">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden flex-1 min-h-[460px] shadow-inner transition-transform transform hover:scale-[1.01]">
        {errorMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 text-red-500 ">
            <p>{errorMsg}</p>
          </div>
        )}

        {!isOn && !errorMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 text-gray-400">
            <p>Camera is off</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${isOn ? "opacity-100" : "opacity-0"}`}
        />

        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {isDetecting && (
            <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              <span>Detecting</span>
            </div>
          )}

          {isConnected && (
            <div className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              <span>Server Connected</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button
          onClick={toggleCamera}
          className={`w-40 ${!isOn ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700"}`}
        >
          {isOn ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Turn Camera Off
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Turn Camera On
            </>
          )}
        </Button>

        <Button
          onClick={toggleDetection}
          disabled={!isOn || !isConnected}
          className={`w-40 ${isDetecting
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"} disabled:opacity-50 disabled:pointer-events-none`}
        >
          {isDetecting ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              Stop Detection
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Detection
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

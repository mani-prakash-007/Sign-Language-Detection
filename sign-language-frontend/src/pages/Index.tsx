
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CameraComponent } from "@/components/Camera";
import { TextOutput } from "@/components/TextOutput";

const Index = () => {
  const [detectedText, setDetectedText] = useState("");
  
  useEffect(() => {
    // Listen for clear text event
    const handleClearText = () => setDetectedText("");
    window.addEventListener('clearText', handleClearText);
    
    return () => {
      window.removeEventListener('clearText', handleClearText);
    };
  }, []);

  // Handle text updates from the camera component
  const handleTextUpdate = (text: string) => {
    setDetectedText(prevText => {
      return prevText ? `${prevText}\n${text}` : text;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-auto">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">Sign Language Detection</span> Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Turn on your camera, make sign language gestures, and see the text translation appear.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] max-h-[70vh]">
          {/* Left Column - Camera */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-5 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Camera Input</h3>
            <CameraComponent onTextUpdate={handleTextUpdate} />
          </div>
          
          {/* Right Column - Text Output */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl transition-all duration-300 hover:shadow-lg">
            <TextOutput text={detectedText} />
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 py-4 text-center text-gray-500 text-sm border-t dark:border-gray-700">
        <p>Sign Language Detector &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Index;

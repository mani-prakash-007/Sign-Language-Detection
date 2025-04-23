
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TextOutputProps {
  text: string;
}

export function TextOutput({ text }: TextOutputProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Scroll to bottom when text updates
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [text]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    // This will be handled by the parent component
    // We'll trigger it using the onTextUpdate prop
    window.dispatchEvent(new CustomEvent('clearText'));
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/20 pb-2 rounded-t-md">
        <div className="flex justify-between items-center">
          <CardTitle className="text-purple-700 dark:text-purple-300 text-lg">
            Detected Text
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopy}
              disabled={!text}
              className={copied ? "bg-green-500 text-white" : ""}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClear}
              disabled={!text}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        <div 
          ref={contentRef}
          className="absolute inset-0 p-4 overflow-y-auto font-medium text-gray-800 dark:text-gray-200"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#d8b4fe transparent' }}
        >
          {text ? (
            text.split('\n').map((line, index) => (
              <div key={index} className="mb-2 animate-fadeIn">
                <span className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                  {line}
                </span>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 italic">
              No sign language detected yet. Turn on camera and press "Start Detection"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
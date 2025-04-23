
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn("w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white p-4 shadow-lg", className)}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-2"></path>
              <path d="M14 16H3"></path>
              <path d="M10 10H3"></path>
              <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
              <circle cx="18" cy="18" r="3"></circle>
              <path d="m15.69 15.69 4.62 4.62"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Sign Language Detector</h1>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li><a href="#" className="hover:text-purple-200 transition-colors">Home</a></li>
            <li><a href="#" className="hover:text-purple-200 transition-colors">About</a></li>
            <li><a href="#" className="hover:text-purple-200 transition-colors">Help</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, Settings } from "lucide-react";

interface GameHeaderProps {
  roomPin: string;
  currentRound: number;
  maxRounds?: number;
  isConnected: boolean;
}

export default function GameHeader({ roomPin, currentRound, maxRounds, isConnected }: GameHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Rocket className="text-primary text-2xl" />
              <h1 className="text-2xl font-bold text-gray-900">Odie Rules</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <Badge variant="outline">Room: #{roomPin}</Badge>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Round {currentRound}</span>
              {maxRounds && <span> of {maxRounds}</span>}
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

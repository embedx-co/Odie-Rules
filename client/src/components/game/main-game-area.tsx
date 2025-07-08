import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Mic, CheckCircle, Clock } from "lucide-react";

interface MainGameAreaProps {
  currentPhase: string;
  currentPrompt: any;
  players: any[];
  currentPlayerId: string;
  onSubmitPitch: (content: string) => void;
}

export default function MainGameArea({
  currentPhase,
  currentPrompt,
  players,
  currentPlayerId,
  onSubmitPitch,
}: MainGameAreaProps) {
  const [pitchContent, setPitchContent] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(120);

  const handleSubmitPitch = () => {
    if (pitchContent.trim()) {
      onSubmitPitch(pitchContent.trim());
      setPitchContent("");
    }
  };

  const getPhaseDisplay = () => {
    switch (currentPhase) {
      case "planning":
        return {
          title: "Planning Phase",
          description: "Craft your pitch and prepare to present",
          icon: <Lightbulb className="w-6 h-6" />,
          color: "bg-yellow-500",
        };
      case "pitching":
        return {
          title: "Pitching Phase",
          description: "Players are presenting their solutions",
          icon: <Mic className="w-6 h-6" />,
          color: "bg-red-500",
        };
      case "investor-selection":
        return {
          title: "Investment Decision",
          description: "The investor is choosing which startup to fund",
          icon: <CheckCircle className="w-6 h-6" />,
          color: "bg-green-500",
        };
      case "voting":
        return {
          title: "Voting Phase",
          description: "Vote for the best pitch",
          icon: <CheckCircle className="w-6 h-6" />,
          color: "bg-green-500",
        };
      case "results":
        return {
          title: "Results",
          description: "Round results are being calculated",
          icon: <CheckCircle className="w-6 h-6" />,
          color: "bg-blue-500",
        };
      default:
        return {
          title: "Waiting",
          description: "Preparing for the next phase",
          icon: <Clock className="w-6 h-6" />,
          color: "bg-gray-500",
        };
    }
  };

  const phaseDisplay = getPhaseDisplay();

  return (
    <div className="space-y-6">
      {/* Phase Indicator */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${phaseDisplay.color} rounded-full flex items-center justify-center`}>
                <div className="text-white">{phaseDisplay.icon}</div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{phaseDisplay.title}</h2>
                <p className="text-gray-600">{phaseDisplay.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
              <div className="text-sm text-gray-500">Time Remaining</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${phaseDisplay.color}`}
              style={{ width: `${(timeRemaining / 120) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Current Prompt */}
      {currentPrompt && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Challenge</span>
              <Badge variant="outline">Prompt #{currentPrompt.promptCard?.id}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-primary to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Lightbulb className="w-8 h-8 opacity-80" />
                <Badge variant="secondary" className="text-primary">
                  Your Challenge
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2">{currentPrompt.promptCard?.text}</h3>
              <p className="text-blue-100">
                Create a solution that addresses this challenge and pitch it to secure funding.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pitch Input */}
      {currentPhase === "planning" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Craft Your Pitch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe your solution, business model, and why investors should fund you..."
              value={pitchContent}
              onChange={(e) => setPitchContent(e.target.value)}
              className="min-h-[150px]"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {pitchContent.length}/500 characters
              </div>
              <Button
                onClick={handleSubmitPitch}
                disabled={!pitchContent.trim()}
              >
                Submit Pitch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Pitch Display */}
      {currentPhase === "pitching" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Pitch</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 min-h-[200px]">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Players are presenting...</h4>
                <p className="text-gray-600">Listen to the pitches and get ready to vote!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

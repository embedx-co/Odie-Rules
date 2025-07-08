import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Users, GamepadIcon, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [hostName, setHostName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomPin, setRoomPin] = useState("");

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/rooms", {
        hostName: hostName.trim(),
        settings: {
          maxPlayers: 10,
          pitchTimerSec: 120,
          presentationTimerSec: 60,
          fundingTargetBillion: 5,
          ventureCardsPerPlayer: 2,
          allowAudienceObservers: true,
          votingMode: "peer",
        },
      });

      const data = await response.json();

      // Store player data in localStorage
      localStorage.setItem("playerId", data.player.id);
      localStorage.setItem("playerName", data.player.name);
      localStorage.setItem("isHost", "true");
      localStorage.setItem("roomPin", data.room.pin);

      setLocation(`/lobby/${data.room.pin}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!roomPin.trim()) {
      toast({
        title: "Error",
        description: "Please enter room PIN",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Check if we have existing player data for this room
      const existingPlayerId = localStorage.getItem("playerId");
      const existingRoomPin = localStorage.getItem("roomPin");
      
      if (existingPlayerId && existingRoomPin === roomPin.trim()) {
        // Try to rejoin first
        try {
          const rejoinResponse = await apiRequest("POST", `/api/rooms/${roomPin.trim()}/rejoin`, {
            playerId: existingPlayerId,
          });
          
          const rejoinData = await rejoinResponse.json();
          
          // Update localStorage with current data
          localStorage.setItem("playerId", rejoinData.player.id);
          localStorage.setItem("playerName", rejoinData.player.name);
          localStorage.setItem("isHost", rejoinData.player.isHost.toString());
          localStorage.setItem("roomPin", roomPin.trim());
          
          // Redirect to appropriate page based on game state
          if (rejoinData.room.state === "lobby") {
            setLocation(`/lobby/${roomPin.trim()}`);
          } else {
            setLocation(`/game/${roomPin.trim()}`);
          }
          
          toast({
            title: "Rejoined!",
            description: "Successfully rejoined the game.",
          });
          return;
        } catch (rejoinError) {
          console.log("Rejoin failed, trying regular join:", rejoinError);
          // If rejoin fails, continue with regular join
        }
      }

      // Regular join for new players
      const response = await apiRequest("POST", `/api/rooms/${roomPin.trim()}/join`, {
        playerName: playerName.trim(),
      });

      const data = await response.json();

      // Store player data in localStorage
      localStorage.setItem("playerId", data.player.id);
      localStorage.setItem("playerName", data.player.name);
      localStorage.setItem("isHost", "false");
      localStorage.setItem("roomPin", roomPin.trim());

      setLocation(`/lobby/${roomPin.trim()}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Please check the PIN and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Rocket className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Odie Rules
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The ultimate startup pitch competition game. Create solutions, pitch ideas, and compete for funding in this real-time multiplayer experience.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multiplayer</h3>
            <p className="text-gray-600">Play with 3-12 players in real-time</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <GamepadIcon className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Strategic Cards</h3>
            <p className="text-gray-600">Use venture cards to change the game</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Compete</h3>
            <p className="text-gray-600">Race to $5 billion in funding</p>
          </div>
        </div>

        {/* Game Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hostName">Your Name</Label>
                <Input
                  id="hostName"
                  placeholder="Enter your name"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full"
                size="lg"
              >
                {isCreating ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Join Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomPin">Room PIN</Label>
                <Input
                  id="roomPin"
                  placeholder="Enter 6-digit PIN"
                  value={roomPin}
                  onChange={(e) => setRoomPin(e.target.value)}
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                disabled={isJoining}
                className="w-full"
                size="lg"
              >
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How to Play */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">1. Get Your Prompt</h4>
                  <p className="text-gray-600">Receive a problem card that needs solving</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. Plan Your Pitch</h4>
                  <p className="text-gray-600">Craft your solution and business idea</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. Present & Compete</h4>
                  <p className="text-gray-600">Pitch your idea to other players</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">4. Vote & Win</h4>
                  <p className="text-gray-600">Vote for the best pitch and earn funding</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy, Settings, Users, Clock, DollarSign, GamepadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { generateAvatar, getAvatarColor, formatFunding } from "@/lib/game-data";
import { apiRequest } from "@/lib/queryClient";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [roomPin, setRoomPin] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [localSettings, setLocalSettings] = useState<any | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Get room PIN from URL
  useEffect(() => {
    const path = window.location.pathname;
    const pin = path.split("/").pop();
    if (pin) {
      setRoomPin(pin);
    }

    // Get player info from localStorage
    const storedPlayerId = localStorage.getItem("playerId");
    const storedIsHost = localStorage.getItem("isHost") === "true";
    const storedRoomPin = localStorage.getItem("roomPin");

    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
      setIsHost(storedIsHost);

      // If the stored room PIN doesn't match current PIN, clear localStorage
      if (storedRoomPin !== pin) {
        localStorage.removeItem("playerId");
        localStorage.removeItem("playerName");
        localStorage.removeItem("isHost");
        localStorage.removeItem("roomPin");
        setLocation("/");
      }
    } else if (pin) {
      // No player data but trying to access lobby - redirect to home
      setLocation("/");
    }
  }, [setLocation]);

  // Fetch room data
  const { data: roomData, isLoading, error } = useQuery({
    queryKey: [`/api/rooms/${roomPin}`],
    enabled: !!roomPin,
    refetchInterval: 2000, // Refetch every 2 seconds for live updates
  });

  useEffect(() => {
    if (roomData) {
      setLocalSettings(roomData.room.settings);
    }
  }, [roomData]);

  // WebSocket connection
  const { isConnected, lastMessage, sendMessage } = useWebSocket(roomPin ? `/ws` : null);

  // Join room via WebSocket when connected
  useEffect(() => {
    if (isConnected && playerId && roomPin) {
      console.log("Joining room via WebSocket", { playerId, roomPin });
      sendMessage({
        type: "JOIN_ROOM",
        playerId,
        roomPin,
      });
    }
  }, [isConnected, playerId, roomPin, sendMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "GAME_STARTED":
          setLocation(`/game/${roomPin}`);
          break;
        case "PLAYER_JOINED":
          // Room data will be updated by the query refetch
          break;
        case "SETTINGS_UPDATED":
          if (lastMessage.settings) {
            setLocalSettings(lastMessage.settings);
          }
          break;
        case "ERROR":
          toast({
            title: "Error",
            description: lastMessage.message,
            variant: "destructive",
          });
          break;
      }
    }
  }, [lastMessage, setLocation, roomPin, toast]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(roomPin);
    toast({
      title: "Copied!",
      description: "Room PIN copied to clipboard",
    });
  };

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    setIsSavingSettings(true);
    try {
      if (isConnected) {
        sendMessage({
          type: "UPDATE_SETTINGS",
          playerId,
          roomPin,
          settings: localSettings,
        });
      } else {
        await apiRequest("PATCH", `/api/rooms/${roomPin}/settings`, {
          hostId: playerId,
          settings: localSettings,
        });
      }
      toast({ title: "Settings updated" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleStartGame = async () => {
    console.log("Start game clicked", { isHost, canStart, players: players.length, isConnected, playerId, roomPin });

    if (!isHost) {
      console.log("Not host, returning");
      return;
    }

    if (!canStart) {
      console.log("Cannot start game", { playersCount: players.length, roomState: roomData.room.state });
      return;
    }

    setIsStarting(true);
    try {
      console.log("Sending start game message");
      // Send WebSocket message to start game
      if (isConnected) {
        sendMessage({
          type: "START_GAME",
          playerId,
          roomPin,
        });
        console.log("WebSocket message sent");
      } else {
        console.log("WebSocket not connected, using API fallback");
        // Fallback to API call if WebSocket not connected
        await apiRequest("POST", `/api/rooms/${roomPin}/start`, {
          hostId: playerId,
        });
        console.log("API call completed");
      }
    } catch (error) {
      console.error("Start game error:", error);
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Room Not Found</h2>
            <p className="text-gray-600 mb-4">
              The room PIN you entered doesn't exist or the room has been closed.
            </p>
            <Button onClick={() => setLocation("/")}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const settings = roomData.room.settings;
  const players = roomData.players || [];
  const canStart = players.length >= 3 && isHost && roomData.room.state === "lobby";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-full p-4 shadow-lg mr-4">
              <GamepadIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Odie Rules</h1>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className="text-lg font-mono bg-white px-3 py-1 rounded-lg shadow">
                  #{roomPin}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPin}
                  className="p-2"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Players ({players.length}/{settings.maxPlayers})</span>
                  <Badge variant={canStart ? "default" : "secondary"}>
                    {canStart ? "Ready to Start" : "Need More Players"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player: any) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        player.id === playerId
                          ? "bg-primary/10 border-primary/20"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getAvatarColor(player.name)} rounded-full flex items-center justify-center`}>
                          <span className="text-white font-semibold text-sm">
                            {generateAvatar(player.name)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {player.name}
                            </span>
                            {player.id === playerId && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {player.isHost && <Badge variant="secondary">Host</Badge>}
                            {player.isJudge && <Badge variant="secondary">Judge</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-secondary">
                          {formatFunding(player.funding)}
                        </div>
                        <div className="text-xs text-gray-500">funding</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Settings */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isHost && localSettings ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Max Players</Label>
                      <Input
                        type="number"
                        min={3}
                        max={12}
                        value={localSettings.maxPlayers}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            maxPlayers: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pitch Time (sec)</Label>
                      <Input
                        type="number"
                        min={30}
                        max={180}
                        value={localSettings.pitchTimerSec}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            pitchTimerSec: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Funding Target (B)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={localSettings.fundingTargetBillion}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            fundingTargetBillion: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Venture Cards per Player</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={localSettings.ventureCardsPerPlayer}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            ventureCardsPerPlayer: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="mr-2">Allow Observers</Label>
                      <Switch
                        checked={localSettings.allowAudienceObservers}
                        onCheckedChange={(val) =>
                          setLocalSettings({
                            ...localSettings,
                            allowAudienceObservers: val,
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="w-full"
                      size="sm"
                    >
                      {isSavingSettings ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Max Players</span>
                      </div>
                      <Badge variant="outline">{settings.maxPlayers}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Pitch Time</span>
                      </div>
                      <Badge variant="outline">{settings.pitchTimerSec}s</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Funding Target</span>
                      </div>
                      <Badge variant="outline">${settings.fundingTargetBillion}B</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GamepadIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Venture Cards</span>
                      </div>
                      <Badge variant="outline">{settings.ventureCardsPerPlayer} per player</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Start Game Button */}
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                {isHost ? (
                  <div className="space-y-2">
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStart || isStarting}
                      className="w-full"
                      size="lg"
                    >
                      {isStarting ? "Starting..." : "Start Game"}
                    </Button>
                    {!canStart && (
                      <p className="text-sm text-gray-500 text-center">
                        {players.length < 3 
                          ? `Need ${3 - players.length} more player${3 - players.length === 1 ? '' : 's'}`
                          : roomData.room.state !== "lobby" 
                            ? "Game already started" 
                            : "Cannot start game"
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Waiting for the host to start the game...
                    </p>
                    <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
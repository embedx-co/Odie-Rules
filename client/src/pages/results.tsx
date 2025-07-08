import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Users, Home } from "lucide-react";
import { generateAvatar, getAvatarColor, formatFunding } from "@/lib/game-data";

export default function Results() {
  const [, setLocation] = useLocation();
  const [roomPin, setRoomPin] = useState("");
  const [finalStandings, setFinalStandings] = useState<any[]>([]);

  // Get room PIN from URL
  useEffect(() => {
    const path = window.location.pathname;
    const pin = path.split("/").pop();
    if (pin) {
      setRoomPin(pin);
    }

    // In a real implementation, this would come from the WebSocket
    // For now, we'll create some sample data
    const mockStandings = [
      { id: "1", name: "Sarah A.", funding: 5200000000 },
      { id: "2", name: "Mike J.", funding: 3800000000 },
      { id: "3", name: "Alex L.", funding: 2100000000 },
      { id: "4", name: "Jenny D.", funding: 1500000000 },
    ];
    setFinalStandings(mockStandings);
  }, []);

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <Users className="w-8 h-8 text-gray-400" />;
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-br from-amber-400 to-amber-600";
      default:
        return "bg-gradient-to-br from-gray-200 to-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mr-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Game Results</h1>
              <p className="text-xl text-gray-600">Final Standings</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Room #{roomPin}
          </Badge>
        </div>

        {/* Podium */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {finalStandings.slice(0, 3).map((player, index) => {
              const position = index + 1;
              const height = position === 1 ? "h-32" : position === 2 ? "h-24" : "h-16";
              
              return (
                <div
                  key={player.id}
                  className={`text-center ${position === 1 ? "md:order-2" : position === 2 ? "md:order-1" : "md:order-3"}`}
                >
                  <div className={`${getPodiumColor(position)} ${height} rounded-t-lg flex items-end justify-center pb-4 mb-4`}>
                    <div className="text-white text-2xl font-bold">{position}</div>
                  </div>
                  <div className="mb-4">
                    <div className={`w-20 h-20 ${getAvatarColor(player.name)} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold text-xl">
                        {generateAvatar(player.name)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
                    <p className="text-2xl font-bold text-secondary">{formatFunding(player.funding)}</p>
                  </div>
                  <div className="flex justify-center">
                    {getPodiumIcon(position)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Rankings */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Final Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {finalStandings.map((player, index) => {
                  const position = index + 1;
                  const isWinner = position === 1;
                  
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        isWinner
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isWinner ? "bg-yellow-500 text-white" : "bg-gray-300 text-gray-700"
                        }`}>
                          {position}
                        </div>
                        <div className={`w-12 h-12 ${getAvatarColor(player.name)} rounded-full flex items-center justify-center`}>
                          <span className="text-white font-semibold">
                            {generateAvatar(player.name)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{player.name}</span>
                            {isWinner && (
                              <Badge className="bg-yellow-500 text-white">Winner</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-secondary">
                          {formatFunding(player.funding)}
                        </div>
                        <div className="text-sm text-gray-500">final funding</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-center mt-12 space-x-4">
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            size="lg"
            className="flex items-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </Button>
          <Button
            onClick={() => setLocation("/")}
            size="lg"
            className="flex items-center space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>Play Again</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

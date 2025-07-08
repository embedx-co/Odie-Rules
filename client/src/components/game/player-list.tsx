import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateAvatar, getAvatarColor, formatFunding } from "@/lib/game-data";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isJudge: boolean;
  isInvestor: boolean;
  funding: number;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

export default function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Players</span>
          <span className="text-sm text-gray-500">{players.length}/10</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.id === currentPlayerId
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${getAvatarColor(player.name)} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-semibold text-sm">
                    {generateAvatar(player.name)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{player.name}</span>
                    {player.id === currentPlayerId && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    {player.isHost && <Badge variant="secondary" className="text-xs">Host</Badge>}
                    {player.isJudge && <Badge variant="secondary" className="text-xs">Judge</Badge>}
                    {player.isInvestor && <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">Investor</Badge>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-secondary text-sm">
                  {formatFunding(player.funding)}
                </div>
                <div className="text-xs text-gray-500">funding</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

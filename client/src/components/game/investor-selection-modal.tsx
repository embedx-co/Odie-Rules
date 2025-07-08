import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { formatFunding } from "@/lib/game-data";

interface Player {
  id: string;
  name: string;
  funding: number;
  isInvestor: boolean;
}

interface InvestorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayerId: string;
  investmentAmount: number;
  onSelectInvestment: (playerId: string) => void;
  timeRemaining?: number;
}

export default function InvestorSelectionModal({
  isOpen,
  onClose,
  players,
  currentPlayerId,
  investmentAmount,
  onSelectInvestment,
  timeRemaining = 30,
}: InvestorSelectionModalProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isInvestor = currentPlayer?.isInvestor || false;
  
  // Only show non-investor players as investment options
  const candidatePlayers = players.filter(p => !p.isInvestor);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Investment Decision
          </DialogTitle>
          <DialogDescription>
            {isInvestor ? (
              <>
                As the investor, choose which startup to fund with{" "}
                <span className="font-semibold text-green-600">
                  {formatFunding(investmentAmount)}
                </span>
              </>
            ) : (
              "The investor is choosing which startup to fund..."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {timeRemaining}s remaining
            </span>
          </div>

          {/* Investment Amount */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Investment Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatFunding(investmentAmount)}
              </div>
            </CardContent>
          </Card>

          {/* Candidate Players */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Startup Candidates
            </h3>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {candidatePlayers.map((player) => (
                <Card
                  key={player.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !isInvestor ? "opacity-60" : ""
                  }`}
                  onClick={() => {
                    if (isInvestor) {
                      onSelectInvestment(player.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {player.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            Current funding: {formatFunding(player.funding)}
                          </div>
                        </div>
                      </div>
                      {player.id === currentPlayerId && (
                        <Badge variant="outline" className="text-blue-600">
                          You
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {!isInvestor && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-600">
                Waiting for the investor to make their decision...
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
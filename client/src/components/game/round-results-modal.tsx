import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { generateAvatar, getAvatarColor, formatFunding } from "@/lib/game-data";

interface RoundResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  players: any[];
}

export default function RoundResultsModal({ isOpen, onClose, results, players }: RoundResultsModalProps) {
  if (!results) return null;

  const winner = players.find(p => p.id === results.winner);
  const voteResults = results.votes || [];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  // Sort players by vote count
  const sortedResults = voteResults
    .map((vote: any) => {
      const player = players.find(p => p.id === vote.candidateId);
      return {
        ...vote,
        player,
      };
    })
    .sort((a: any, b: any) => b.count - a.count);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl mb-2">Round Results</DialogTitle>
            {winner && (
              <p className="text-gray-600">{winner.name} takes the lead!</p>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {sortedResults.map((result: any, index: number) => {
            const position = index + 1;
            const isWinner = position === 1;
            
            return (
              <div
                key={result.candidateId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isWinner
                    ? "bg-secondary/10 border border-secondary/20"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getPositionIcon(position)}
                    <div className={`w-10 h-10 ${getAvatarColor(result.player?.name || '')} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold">
                        {generateAvatar(result.player?.name || '')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{result.player?.name}</span>
                      {isWinner && (
                        <Badge className="bg-secondary text-white">Winner</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Position #{position}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${isWinner ? 'text-secondary' : 'text-gray-600'}`}>
                    {isWinner ? '+$1.0B' : '$0'}
                  </div>
                  <div className="text-sm text-gray-500">{result.count} votes</div>
                </div>
              </div>
            );
          })}
          
          {sortedResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No votes were cast this round</p>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <Button onClick={onClose} className="w-full">
            Continue to Next Round
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

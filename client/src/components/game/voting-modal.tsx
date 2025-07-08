import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateAvatar, getAvatarColor } from "@/lib/game-data";
import { ChevronRight } from "lucide-react";

interface Player {
  id: string;
  name: string;
  funding: number;
}

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayerId: string;
  onVote: (candidateId: string) => void;
}

export default function VotingModal({ isOpen, onClose, players, currentPlayerId, onVote }: VotingModalProps) {
  const votablePlayers = players.filter(p => p.id !== currentPlayerId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl mb-2">Cast Your Vote</DialogTitle>
          <p className="text-center text-gray-600">Who had the best pitch this round?</p>
        </DialogHeader>
        <div className="space-y-3 mt-6">
          {votablePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => onVote(player.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getAvatarColor(player.name)} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-semibold">
                    {generateAvatar(player.name)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{player.name}</div>
                  <div className="text-sm text-gray-500">Click to vote</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
        <div className="mt-6 flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Skip Vote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

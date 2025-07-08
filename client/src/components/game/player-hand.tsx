import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VentureCard {
  id: string;
  title: string;
  text: string;
  playWindow: string;
}

interface PlayerHandProps {
  ventureCards: VentureCard[];
  onPlayCard: (cardId: string, targetPlayerId?: string) => void;
  currentPhase: string;
}

export default function PlayerHand({ ventureCards, onPlayCard, currentPhase }: PlayerHandProps) {
  const canPlayCard = (card: VentureCard) => {
    switch (card.playWindow) {
      case "pre":
        return currentPhase === "planning";
      case "mid":
        return currentPhase === "pitching";
      case "post":
        return currentPhase === "voting";
      default:
        return false;
    }
  };

  const getCardGradient = (title: string) => {
    const gradients = [
      "from-indigo-500 to-purple-500",
      "from-purple-500 to-pink-500",
      "from-pink-500 to-red-500",
      "from-red-500 to-orange-500",
      "from-orange-500 to-yellow-500",
      "from-yellow-500 to-green-500",
      "from-green-500 to-teal-500",
      "from-teal-500 to-blue-500",
      "from-blue-500 to-indigo-500",
    ];
    
    const index = title.length % gradients.length;
    return gradients[index];
  };

  if (ventureCards.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">No venture cards remaining</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Venture Cards</h3>
          <div className="text-sm text-gray-500">{ventureCards.length} remaining</div>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {ventureCards.map((card) => {
            const playable = canPlayCard(card);
            
            return (
              <div
                key={card.id}
                className={`flex-shrink-0 w-48 bg-gradient-to-r ${getCardGradient(card.title)} rounded-lg p-4 text-white transition-all duration-200 ${
                  playable ? "cursor-pointer hover:shadow-lg hover:scale-105" : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">{card.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {card.playWindow}
                  </Badge>
                </div>
                <p className="text-xs opacity-90 mb-3 line-clamp-3">{card.text}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  disabled={!playable}
                  onClick={() => onPlayCard(card.id)}
                >
                  {playable ? "Play Card" : "Cannot Play"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

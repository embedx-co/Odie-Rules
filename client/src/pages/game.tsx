import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import GameHeader from "@/components/game/game-header";
import PlayerList from "@/components/game/player-list";
import MainGameArea from "@/components/game/main-game-area";
import PlayerHand from "@/components/game/player-hand";
import VotingModal from "@/components/game/voting-modal";
import RoundResultsModal from "@/components/game/round-results-modal";

export default function Game() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [roomPin, setRoomPin] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [gameState, setGameState] = useState<any>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("lobby");
  const [roundResults, setRoundResults] = useState<any>(null);

  // Get room PIN from URL
  useEffect(() => {
    const path = window.location.pathname;
    const pin = path.split("/").pop();
    if (pin) {
      setRoomPin(pin);
    }

    // Get player info from localStorage
    const storedPlayerId = localStorage.getItem("playerId");
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, []);

  // WebSocket connection
  const { isConnected, lastMessage, sendMessage } = useWebSocket(roomPin ? `/ws` : null);

  // Connect to WebSocket when ready
  useEffect(() => {
    if (roomPin && playerId && isConnected) {
      sendMessage({
        type: "JOIN_ROOM",
        playerId,
        roomPin,
      });
    }
  }, [roomPin, playerId, isConnected, sendMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "GAME_STATE":
          setGameState(lastMessage.state);
          break;
        case "ROUND_START":
          setCurrentPhase("planning");
          setGameState((prev: any) => ({
            ...prev,
            currentRound: {
              ...prev?.currentRound,
              prompts: lastMessage.prompts,
            },
          }));
          break;
        case "PITCHING_PHASE_START":
          setCurrentPhase("pitching");
          break;
        case "PLAYER_TURN":
          setCurrentPhase("pitching");
          break;
        case "VOTING_PHASE_START":
          setCurrentPhase("voting");
          setShowVotingModal(true);
          break;
        case "ROUND_END":
          setCurrentPhase("results");
          setRoundResults(lastMessage);
          setShowResultsModal(true);
          setShowVotingModal(false);
          break;
        case "GAME_END":
          setLocation(`/results/${roomPin}`);
          break;
        case "VENTURE_PLAYED":
          toast({
            title: "Venture Card Played",
            description: `${lastMessage.playerId} played ${lastMessage.cardId}`,
          });
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

  const handlePlayVentureCard = (cardId: string, targetPlayerId?: string) => {
    sendMessage({
      type: "PLAY_VENTURE_CARD",
      cardId,
      targetPlayerId,
    });
  };

  const handleSubmitPitch = (content: string) => {
    sendMessage({
      type: "SUBMIT_PITCH",
      content,
    });
  };

  const handleCastVote = (candidateId: string) => {
    sendMessage({
      type: "CAST_VOTE",
      candidateId,
    });
    setShowVotingModal(false);
  };

  const handleCloseResultsModal = () => {
    setShowResultsModal(false);
    setCurrentPhase("planning");
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p: any) => p.id === playerId);
  const currentPrompt = gameState.currentRound?.prompts?.find((p: any) => p.playerId === playerId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <GameHeader
        roomPin={roomPin}
        currentRound={gameState.room.currentRound}
        maxRounds={gameState.room.settings.maxRounds}
        isConnected={isConnected}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <PlayerList
              players={gameState.players}
              currentPlayerId={playerId}
            />
          </div>
          
          <div className="lg:col-span-3">
            <MainGameArea
              currentPhase={currentPhase}
              currentPrompt={currentPrompt}
              players={gameState.players}
              currentPlayerId={playerId}
              onSubmitPitch={handleSubmitPitch}
            />
          </div>
        </div>
      </div>

      <PlayerHand
        ventureCards={currentPlayer?.ventureCards || []}
        onPlayCard={handlePlayVentureCard}
        currentPhase={currentPhase}
      />

      <VotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        players={gameState.players}
        currentPlayerId={playerId}
        onVote={handleCastVote}
      />

      <RoundResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseResultsModal}
        results={roundResults}
        players={gameState.players}
      />
    </div>
  );
}

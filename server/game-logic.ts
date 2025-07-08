import { storage } from "./storage";
import { broadcastToRoom } from "./websocket";

export class GameLogic {
  async getGameState(roomId: number) {
    const room = await storage.getGameRoom(roomId);
    if (!room) throw new Error("Room not found");

    const players = await storage.getPlayersByRoom(roomId);
    const rounds = await storage.getRoundsByRoom(roomId);
    const currentRound = rounds.find(r => r.roundNo === room.currentRound);

    return {
      room: {
        id: room.id,
        pin: room.roomPin,
        state: room.state,
        settings: room.settings,
        currentRound: room.currentRound,
      },
      players: players.map(p => ({
        id: p.playerId,
        name: p.name,
        isHost: p.isHost,
        isJudge: p.isJudge,
        funding: p.funding,
        ventureCards: p.ventureCards,
      })),
      currentRound: currentRound ? {
        id: currentRound.id,
        roundNo: currentRound.roundNo,
        promptDeals: currentRound.promptDeals,
        venturePlays: currentRound.venturePlays,
        pitches: currentRound.pitches,
        votes: currentRound.votes,
      } : null,
    };
  }

  async startGame(roomId: number, hostId: string) {
    const room = await storage.getGameRoom(roomId);
    if (!room) throw new Error("Room not found");
    
    if (room.hostId !== hostId) {
      throw new Error("Only the host can start the game");
    }

    const players = await storage.getPlayersByRoom(roomId);
    if (players.length < 3) {
      throw new Error("At least 3 players required to start");
    }

    // Deal venture cards to players
    const ventureCards = await storage.getAllVentureCards();
    const settings = room.settings as any;
    
    for (const player of players) {
      const playerCards = this.shuffleArray([...ventureCards])
        .slice(0, settings.ventureCardsPerPlayer)
        .map(card => ({
          id: card.cardId,
          title: card.title,
          text: card.text,
          playWindow: card.playWindow,
        }));

      await storage.updatePlayer(player.playerId, {
        ventureCards: playerCards,
        isInvestor: false, // Reset investor status
      });
    }

    // Assign first investor (host starts as investor)
    await storage.updatePlayer(hostId, { isInvestor: true });

    // Update room state
    await storage.updateGameRoom(roomId, {
      state: "in_round",
      currentRound: 1,
    });

    // Broadcast game started
    broadcastToRoom(roomId, {
      type: "GAME_STARTED",
    });

    // Start first round
    await this.startRound(roomId, 1);
  }

  async startRound(roomId: number, roundNo: number) {
    const players = await storage.getPlayersByRoom(roomId);
    const promptCards = await storage.getAllPromptCards();
    
    // Find current investor
    const investor = players.find(p => p.isInvestor);
    if (!investor) throw new Error("No investor found for round");
    
    // Get a single prompt card for the round
    const shuffledPrompts = this.shuffleArray([...promptCards]);
    const promptCard = shuffledPrompts[0];

    const round = await storage.createRound({
      roomId,
      roundNo,
      investorId: investor.playerId,
      promptCard,
      venturePlays: [],
      pitches: [],
      votes: [],
    });

    // Broadcast round start
    broadcastToRoom(roomId, {
      type: "ROUND_START",
      round: roundNo,
      promptCard,
      investorId: investor.playerId,
    });

    // Start planning phase timer
    const room = await storage.getGameRoom(roomId);
    const settings = room?.settings as any;
    setTimeout(() => {
      this.startPitchingPhase(roomId, round.id);
    }, settings.pitchTimerSec * 1000);
  }

  async startPitchingPhase(roomId: number, roundId: number) {
    broadcastToRoom(roomId, {
      type: "PITCHING_PHASE_START",
      roundId,
    });

    const players = await storage.getPlayersByRoom(roomId);
    const pitchers = players.filter(p => !p.isInvestor); // Only non-investors pitch
    const room = await storage.getGameRoom(roomId);
    const settings = room?.settings as any;
    
    let currentPlayerIndex = 0;

    const pitchNextPlayer = () => {
      if (currentPlayerIndex >= pitchers.length) {
        this.startInvestorSelectionPhase(roomId, roundId);
        return;
      }

      const currentPlayer = pitchers[currentPlayerIndex];
      broadcastToRoom(roomId, {
        type: "PLAYER_TURN",
        playerId: currentPlayer.playerId,
        timeLimit: settings.presentationTimerSec,
      });

      currentPlayerIndex++;
      setTimeout(pitchNextPlayer, (settings.presentationTimerSec + 5) * 1000); // Add 5 seconds buffer
    };

    pitchNextPlayer();
  }

  async startInvestorSelectionPhase(roomId: number, roundId: number) {
    const room = await storage.getGameRoom(roomId);
    const settings = room?.settings as any;
    
    broadcastToRoom(roomId, {
      type: "INVESTOR_SELECTION_START",
      roundId,
      timeLimit: settings.investorSelectionTimerSec,
    });

    setTimeout(() => {
      this.endRound(roomId, roundId);
    }, settings.investorSelectionTimerSec * 1000);
  }

  async startVotingPhase(roomId: number, roundId: number) {
    const room = await storage.getGameRoom(roomId);
    const settings = room?.settings as any;
    
    broadcastToRoom(roomId, {
      type: "VOTING_PHASE_START",
      roundId,
      timeLimit: settings.votingTimerSec,
    });

    setTimeout(() => {
      this.endRound(roomId, roundId);
    }, settings.votingTimerSec * 1000);
  }

  async endRound(roomId: number, roundId: number) {
    const round = await storage.getRound(roundId);
    const players = await storage.getPlayersByRoom(roomId);
    const room = await storage.getGameRoom(roomId);
    const settings = room?.settings as any;

    if (!round) return;

    // Check if there's an investor choice (new flow) or use voting (legacy flow)
    let winner = "";
    if (round.investorChoice) {
      winner = round.investorChoice;
    } else {
      // Fall back to voting system if no investor choice
      const votes = await storage.getVotesByRound(roundId);
      const voteCount = new Map<string, number>();
      votes.forEach(vote => {
        voteCount.set(vote.candidateId, (voteCount.get(vote.candidateId) || 0) + 1);
      });

      let maxVotes = 0;
      for (const [candidateId, count] of voteCount) {
        if (count > maxVotes) {
          maxVotes = count;
          winner = candidateId;
        }
      }
    }

    const investmentAmount = settings.investmentAmountBillion * 1000000000;

    // Award funding only if winner hasn't been awarded yet
    if (winner && !round.winnerId) {
      const winnerPlayer = players.find(p => p.playerId === winner);
      if (winnerPlayer) {
        const newFunding = winnerPlayer.funding + investmentAmount;
        await storage.updatePlayer(winner, { funding: newFunding });
      }
    }

    // Update round
    await storage.updateRound(roundId, {
      winnerId: winner,
      completedAt: new Date(),
    });

    // Broadcast results
    broadcastToRoom(roomId, {
      type: "ROUND_END",
      winner,
      votes: Array.from(voteCount.entries()).map(([candidateId, count]) => ({
        candidateId,
        count,
      })),
    });

    // Check game end conditions
    const updatedPlayers = await storage.getPlayersByRoom(roomId);
    const targetFunding = settings.fundingTargetBillion * 1000000000;
    const hasWinner = updatedPlayers.some(p => p.funding >= targetFunding);
    const maxRoundsReached = settings.maxRounds && room?.currentRound >= settings.maxRounds;

    if (hasWinner || maxRoundsReached) {
      await this.endGame(roomId);
    } else {
      // Rotate investor to next player
      const currentInvestor = players.find(p => p.isInvestor);
      const currentIndex = players.findIndex(p => p.playerId === currentInvestor?.playerId);
      const nextIndex = (currentIndex + 1) % players.length;
      
      // Reset all players to non-investor
      for (const player of players) {
        await storage.updatePlayer(player.playerId, { isInvestor: false });
      }
      
      // Set next investor
      await storage.updatePlayer(players[nextIndex].playerId, { isInvestor: true });

      // Start next round
      const nextRound = (room?.currentRound || 0) + 1;
      await storage.updateGameRoom(roomId, { currentRound: nextRound });
      setTimeout(() => {
        this.startRound(roomId, nextRound);
      }, 5000);
    }
  }

  async endGame(roomId: number) {
    await storage.updateGameRoom(roomId, { state: "finished" });
    
    const players = await storage.getPlayersByRoom(roomId);
    const sortedPlayers = players.sort((a, b) => b.funding - a.funding);

    broadcastToRoom(roomId, {
      type: "GAME_END",
      finalStandings: sortedPlayers.map(p => ({
        id: p.playerId,
        name: p.name,
        funding: p.funding,
      })),
    });
  }

  async playVentureCard(roomId: number, playerId: string, cardId: string, targetPlayerId?: string) {
    const player = await storage.getPlayer(playerId);
    if (!player) throw new Error("Player not found");

    const playerCards = player.ventureCards as any[];
    const cardIndex = playerCards.findIndex((card: any) => card.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error("Card not found in player's hand");
    }

    const card = playerCards[cardIndex];
    
    // Remove card from player's hand
    playerCards.splice(cardIndex, 1);
    await storage.updatePlayer(playerId, { ventureCards: playerCards });

    // Apply card effects (simplified implementation)
    await this.applyVentureCardEffect(roomId, playerId, card, targetPlayerId);

    return card;
  }

  async applyVentureCardEffect(roomId: number, playerId: string, card: any, targetPlayerId?: string) {
    const player = await storage.getPlayer(playerId);
    if (!player) return;

    // Simplified card effects - in a full implementation, each card would have specific logic
    switch (card.title) {
      case "START-UP":
        if (player.funding === 0) {
          await storage.updatePlayer(playerId, { funding: 2000000000 });
        }
        break;
      case "ACQUISITION":
        if (targetPlayerId) {
          const target = await storage.getPlayer(targetPlayerId);
          if (target && target.funding >= 500000000) {
            await storage.updatePlayer(targetPlayerId, { funding: target.funding - 500000000 });
            await storage.updatePlayer(playerId, { funding: player.funding + 500000000 });
          }
        }
        break;
      // Add more card effects as needed
    }
  }

  async submitPitch(roomId: number, playerId: string, content: string) {
    const room = await storage.getGameRoom(roomId);
    if (!room) throw new Error("Room not found");

    const rounds = await storage.getRoundsByRoom(roomId);
    const currentRound = rounds.find(r => r.roundNo === room.currentRound);
    
    if (!currentRound) throw new Error("No active round");

    await storage.createPitch({
      playerId,
      roundId: currentRound.id,
      content,
    });
  }

  async selectInvestment(roomId: number, investorId: string, chosenPlayerId: string) {
    const room = await storage.getGameRoom(roomId);
    if (!room) throw new Error("Room not found");

    const rounds = await storage.getRoundsByRoom(roomId);
    const currentRound = rounds.find(r => r.roundNo === room.currentRound);
    
    if (!currentRound) throw new Error("No active round");

    // Verify the investor is making the choice
    if (currentRound.investorId !== investorId) {
      throw new Error("Only the investor can make this choice");
    }

    // Update the round with the investor's choice
    await storage.updateRound(currentRound.id, {
      investorChoice: chosenPlayerId,
    });

    // Award the investment
    const settings = room.settings as any;
    const investmentAmount = settings.investmentAmountBillion * 1000000000;
    
    const chosenPlayer = await storage.getPlayer(chosenPlayerId);
    if (chosenPlayer) {
      await storage.updatePlayer(chosenPlayerId, {
        funding: chosenPlayer.funding + investmentAmount,
      });
    }

    // Broadcast the investment decision
    broadcastToRoom(roomId, {
      type: "INVESTMENT_DECISION",
      investorId,
      chosenPlayerId,
      investmentAmount,
    });
  }

  async castVote(roomId: number, voterId: string, candidateId: string) {
    const room = await storage.getGameRoom(roomId);
    if (!room) throw new Error("Room not found");

    const rounds = await storage.getRoundsByRoom(roomId);
    const currentRound = rounds.find(r => r.roundNo === room.currentRound);
    
    if (!currentRound) throw new Error("No active round");

    // Check if vote already exists
    const existingVote = await storage.getVoteByVoterAndRound(voterId, currentRound.id);
    if (existingVote) {
      throw new Error("Vote already cast for this round");
    }

    await storage.createVote({
      voterId,
      candidateId,
      roundId: currentRound.id,
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

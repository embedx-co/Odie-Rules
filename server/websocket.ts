import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { GameLogic } from "./game-logic";

interface GameClient {
  ws: WebSocket;
  playerId?: string;
  roomId?: number;
}

const clients = new Map<string, GameClient>();
const gameLogic = new GameLogic();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(clientId, { ws });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(clientId, message);
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "ERROR", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(clientId);
    });
  });
}

async function handleMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case "JOIN_ROOM":
      await handleJoinRoom(clientId, message);
      break;
    case "READY":
      await handleReady(clientId, message);
      break;
    case "PLAY_VENTURE_CARD":
      await handlePlayVentureCard(clientId, message);
      break;
    case "SUBMIT_PITCH":
      await handleSubmitPitch(clientId, message);
      break;
    case "CAST_VOTE":
      await handleCastVote(clientId, message);
      break;
    case "SELECT_INVESTMENT":
      await handleSelectInvestment(clientId, message);
      break;
    case "START_GAME":
      await handleStartGame(clientId, message);
      break;
    default:
      client.ws.send(JSON.stringify({ type: "ERROR", message: "Unknown message type" }));
  }
}

async function handleJoinRoom(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const { playerId, roomPin } = message;
  const room = await storage.getGameRoomByPin(roomPin);
  
  if (!room) {
    client.ws.send(JSON.stringify({ type: "ERROR", message: "Room not found" }));
    return;
  }

  const player = await storage.getPlayer(playerId);
  if (!player || player.roomId !== room.id) {
    client.ws.send(JSON.stringify({ type: "ERROR", message: "Player not found in room" }));
    return;
  }

  client.playerId = playerId;
  client.roomId = room.id;

  // Send current game state
  const gameState = await gameLogic.getGameState(room.id);
  client.ws.send(JSON.stringify({
    type: "GAME_STATE",
    state: gameState,
  }));

  // Notify other players
  broadcastToRoom(room.id, {
    type: "PLAYER_JOINED",
    player: {
      id: player.playerId,
      name: player.name,
      funding: player.funding,
    },
  }, clientId);
}

async function handleReady(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  broadcastToRoom(client.roomId, {
    type: "PLAYER_READY",
    playerId: client.playerId,
  });
}

async function handlePlayVentureCard(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client || !client.roomId || !client.playerId) return;

  const { cardId, targetPlayerId } = message;
  
  try {
    await gameLogic.playVentureCard(client.roomId, client.playerId, cardId, targetPlayerId);
    
    broadcastToRoom(client.roomId, {
      type: "VENTURE_PLAYED",
      playerId: client.playerId,
      cardId,
      targetPlayerId,
    });
  } catch (error) {
    client.ws.send(JSON.stringify({ 
      type: "ERROR", 
      message: error instanceof Error ? error.message : "Failed to play venture card" 
    }));
  }
}

async function handleSubmitPitch(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client || !client.roomId || !client.playerId) return;

  const { content } = message;
  
  try {
    await gameLogic.submitPitch(client.roomId, client.playerId, content);
    
    broadcastToRoom(client.roomId, {
      type: "PITCH_SUBMITTED",
      playerId: client.playerId,
      content,
    });
  } catch (error) {
    client.ws.send(JSON.stringify({ 
      type: "ERROR", 
      message: error instanceof Error ? error.message : "Failed to submit pitch" 
    }));
  }
}

async function handleSelectInvestment(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client || !client.roomId || !client.playerId) return;

  const { chosenPlayerId } = message;
  
  try {
    await gameLogic.selectInvestment(client.roomId, client.playerId, chosenPlayerId);
    
    // Broadcast updated game state
    const gameState = await gameLogic.getGameState(client.roomId);
    broadcastToRoom(client.roomId, {
      type: "GAME_STATE_UPDATE",
      gameState,
    });
  } catch (error) {
    client.ws.send(JSON.stringify({ 
      type: "ERROR", 
      message: error instanceof Error ? error.message : "Failed to select investment" 
    }));
  }
}

async function handleCastVote(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client || !client.roomId || !client.playerId) return;

  const { candidateId } = message;
  
  try {
    await gameLogic.castVote(client.roomId, client.playerId, candidateId);
    
    broadcastToRoom(client.roomId, {
      type: "VOTE_CAST",
      voterId: client.playerId,
      candidateId,
    });
  } catch (error) {
    client.ws.send(JSON.stringify({ 
      type: "ERROR", 
      message: error instanceof Error ? error.message : "Failed to cast vote" 
    }));
  }
}

async function handleStartGame(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client || !client.roomId || !client.playerId) return;

  try {
    await gameLogic.startGame(client.roomId, client.playerId);
    
    broadcastToRoom(client.roomId, {
      type: "GAME_STARTED",
    });
  } catch (error) {
    client.ws.send(JSON.stringify({ 
      type: "ERROR", 
      message: error instanceof Error ? error.message : "Failed to start game" 
    }));
  }
}

function broadcastToRoom(roomId: number, message: any, excludeClientId?: string) {
  for (const [clientId, client] of clients) {
    if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN && clientId !== excludeClientId) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

export { broadcastToRoom };

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { gameSettingsSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { setupWebSocket, broadcastToRoom } from "./websocket";

function generateRoomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize cards in database
  await storage.seedCards();

  // Create game room
  app.post("/api/rooms", async (req, res) => {
    try {
      const { hostName, settings } = req.body;
      
      if (!hostName) {
        return res.status(400).json({ error: "Host name is required" });
      }

      const validatedSettings = gameSettingsSchema.parse(settings || {});
      const roomPin = generateRoomPin();
      const hostId = nanoid();

      const room = await storage.createGameRoom({
        roomPin,
        hostId,
        state: "lobby",
        settings: validatedSettings,
      });

      const host = await storage.createPlayer({
        playerId: hostId,
        roomId: room.id,
        name: hostName,
        isHost: true,
        funding: 0,
        ventureCards: [],
      });

      res.json({
        room: {
          id: room.id,
          pin: room.roomPin,
          hostId: room.hostId,
          state: room.state,
          settings: room.settings,
        },
        player: {
          id: host.playerId,
          name: host.name,
          isHost: host.isHost,
          funding: host.funding,
        },
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Join game room
  app.post("/api/rooms/:pin/join", async (req, res) => {
    try {
      const { pin } = req.params;
      const { playerName } = req.body;

      if (!playerName) {
        return res.status(400).json({ error: "Player name is required" });
      }

      const room = await storage.getGameRoomByPin(pin);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.state !== "lobby") {
        return res.status(400).json({ error: "Game already in progress" });
      }

      const existingPlayers = await storage.getPlayersByRoom(room.id);
      const settings = room.settings as any;
      
      if (existingPlayers.length >= settings.maxPlayers) {
        return res.status(400).json({ error: "Room is full" });
      }

      const playerId = nanoid();
      const player = await storage.createPlayer({
        playerId,
        roomId: room.id,
        name: playerName,
        isHost: false,
        funding: 0,
        ventureCards: [],
      });

      res.json({
        room: {
          id: room.id,
          pin: room.roomPin,
          hostId: room.hostId,
          state: room.state,
          settings: room.settings,
        },
        player: {
          id: player.playerId,
          name: player.name,
          isHost: player.isHost,
          funding: player.funding,
        },
      });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ error: "Failed to join room" });
    }
  });

  // Rejoin game room
  app.post("/api/rooms/:pin/rejoin", async (req, res) => {
    try {
      const { pin } = req.params;
      const { playerId } = req.body;

      if (!playerId) {
        return res.status(400).json({ error: "Player ID is required" });
      }

      const room = await storage.getGameRoomByPin(pin);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const player = await storage.getPlayer(playerId);
      if (!player || player.roomId !== room.id) {
        return res.status(404).json({ error: "Player not found in this room" });
      }

      res.json({
        room: {
          id: room.id,
          pin: room.roomPin,
          hostId: room.hostId,
          state: room.state,
          settings: room.settings,
          currentRound: room.currentRound,
        },
        player: {
          id: player.playerId,
          name: player.name,
          isHost: player.isHost,
          funding: player.funding,
        },
      });
    } catch (error) {
      console.error("Error rejoining room:", error);
      res.status(500).json({ error: "Failed to rejoin room" });
    }
  });

  // Get room details
  app.get("/api/rooms/:pin", async (req, res) => {
    try {
      const { pin } = req.params;
      const room = await storage.getGameRoomByPin(pin);
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const players = await storage.getPlayersByRoom(room.id);
      const rounds = await storage.getRoundsByRoom(room.id);

      res.json({
        room: {
          id: room.id,
          pin: room.roomPin,
          hostId: room.hostId,
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
        rounds: rounds.length,
      });
    } catch (error) {
      console.error("Error getting room:", error);
      res.status(500).json({ error: "Failed to get room details" });
    }
  });

  // Update room settings
  app.patch("/api/rooms/:pin/settings", async (req, res) => {
    try {
      const { pin } = req.params;
      const { hostId, settings } = req.body;

      const room = await storage.getGameRoomByPin(pin);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.hostId !== hostId) {
        return res.status(403).json({ error: "Only the host can update settings" });
      }

      if (room.state !== "lobby") {
        return res.status(400).json({ error: "Cannot update settings after game start" });
      }

      const validated = gameSettingsSchema.parse({ ...room.settings, ...(settings || {}) });
      const updated = await storage.updateGameRoom(room.id, { settings: validated });

      broadcastToRoom(room.id, { type: "SETTINGS_UPDATED", settings: updated.settings });

      res.json({ settings: updated.settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Start game
  app.post("/api/rooms/:pin/start", async (req, res) => {
    try {
      const { pin } = req.params;
      const { hostId } = req.body;

      const room = await storage.getGameRoomByPin(pin);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (room.hostId !== hostId) {
        return res.status(403).json({ error: "Only the host can start the game" });
      }

      if (room.state !== "lobby") {
        return res.status(400).json({ error: "Game is not in lobby state" });
      }

      const players = await storage.getPlayersByRoom(room.id);
      if (players.length < 3) {
        return res.status(400).json({ error: "At least 3 players required to start" });
      }

      await storage.updateGameRoom(room.id, {
        state: "in_round",
        currentRound: 1,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error starting game:", error);
      res.status(500).json({ error: "Failed to start game" });
    }
  });

  // Submit pitch
  app.post("/api/pitches", async (req, res) => {
    try {
      const { playerId, roundId, content } = req.body;

      if (!playerId || !roundId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const pitch = await storage.createPitch({
        playerId,
        roundId,
        content,
      });

      res.json({ pitch });
    } catch (error) {
      console.error("Error submitting pitch:", error);
      res.status(500).json({ error: "Failed to submit pitch" });
    }
  });

  // Submit vote
  app.post("/api/votes", async (req, res) => {
    try {
      const { voterId, candidateId, roundId } = req.body;

      if (!voterId || !candidateId || !roundId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if vote already exists
      const existingVote = await storage.getVoteByVoterAndRound(voterId, roundId);
      if (existingVote) {
        return res.status(400).json({ error: "Vote already cast for this round" });
      }

      const vote = await storage.createVote({
        voterId,
        candidateId,
        roundId,
      });

      res.json({ vote });
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ error: "Failed to submit vote" });
    }
  });

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupWebSocket(wss);

  return httpServer;
}

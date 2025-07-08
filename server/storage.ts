import { 
  gameRooms, 
  players, 
  promptCards, 
  ventureCards, 
  rounds, 
  pitches, 
  votes,
  users,
  type GameRoom,
  type Player,
  type PromptCard,
  type VentureCard,
  type Round,
  type Pitch,
  type Vote,
  type User,
  type InsertGameRoom,
  type InsertPlayer,
  type InsertPromptCard,
  type InsertVentureCard,
  type InsertRound,
  type InsertPitch,
  type InsertVote,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Game room methods
  createGameRoom(room: InsertGameRoom): Promise<GameRoom>;
  getGameRoom(id: number): Promise<GameRoom | undefined>;
  getGameRoomByPin(pin: string): Promise<GameRoom | undefined>;
  updateGameRoom(id: number, updates: Partial<GameRoom>): Promise<GameRoom>;
  deleteGameRoom(id: number): Promise<void>;

  // Player methods
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(playerId: string): Promise<Player | undefined>;
  getPlayersByRoom(roomId: number): Promise<Player[]>;
  updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player>;
  deletePlayer(playerId: string): Promise<void>;

  // Card methods
  createPromptCard(card: InsertPromptCard): Promise<PromptCard>;
  createVentureCard(card: InsertVentureCard): Promise<VentureCard>;
  getAllPromptCards(): Promise<PromptCard[]>;
  getAllVentureCards(): Promise<VentureCard[]>;
  seedCards(): Promise<void>;

  // Round methods
  createRound(round: InsertRound): Promise<Round>;
  getRound(id: number): Promise<Round | undefined>;
  getRoundsByRoom(roomId: number): Promise<Round[]>;
  updateRound(id: number, updates: Partial<Round>): Promise<Round>;

  // Pitch methods
  createPitch(pitch: InsertPitch): Promise<Pitch>;
  getPitchesByRound(roundId: number): Promise<Pitch[]>;

  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotesByRound(roundId: number): Promise<Vote[]>;
  getVoteByVoterAndRound(voterId: string, roundId: number): Promise<Vote | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Game room methods
  async createGameRoom(room: InsertGameRoom): Promise<GameRoom> {
    const [gameRoom] = await db.insert(gameRooms).values(room).returning();
    return gameRoom;
  }

  async getGameRoom(id: number): Promise<GameRoom | undefined> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.id, id));
    return room || undefined;
  }

  async getGameRoomByPin(pin: string): Promise<GameRoom | undefined> {
    const [room] = await db.select().from(gameRooms).where(eq(gameRooms.roomPin, pin));
    return room || undefined;
  }

  async updateGameRoom(id: number, updates: Partial<GameRoom>): Promise<GameRoom> {
    const [room] = await db.update(gameRooms).set(updates).where(eq(gameRooms.id, id)).returning();
    return room;
  }

  async deleteGameRoom(id: number): Promise<void> {
    await db.delete(gameRooms).where(eq(gameRooms.id, id));
  }

  // Player methods
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async getPlayer(playerId: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.playerId, playerId));
    return player || undefined;
  }

  async getPlayersByRoom(roomId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.roomId, roomId));
  }

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player> {
    const [player] = await db.update(players).set(updates).where(eq(players.playerId, playerId)).returning();
    return player;
  }

  async deletePlayer(playerId: string): Promise<void> {
    await db.delete(players).where(eq(players.playerId, playerId));
  }

  // Card methods
  async createPromptCard(card: InsertPromptCard): Promise<PromptCard> {
    const [newCard] = await db.insert(promptCards).values(card).returning();
    return newCard;
  }

  async createVentureCard(card: InsertVentureCard): Promise<VentureCard> {
    const [newCard] = await db.insert(ventureCards).values(card).returning();
    return newCard;
  }

  async getAllPromptCards(): Promise<PromptCard[]> {
    return await db.select().from(promptCards);
  }

  async getAllVentureCards(): Promise<VentureCard[]> {
    return await db.select().from(ventureCards);
  }

  async seedCards(): Promise<void> {
    // Check if cards already exist
    const existingPrompts = await db.select().from(promptCards).limit(1);
    const existingVentures = await db.select().from(ventureCards).limit(1);
    
    if (existingPrompts.length === 0) {
      // Import prompt cards from the data file
      const { pitchPrompts } = await import("../client/src/lib/game-data");
      const promptCardData = pitchPrompts.map((text, index) => ({
        cardId: `prompt_${index + 1}`,
        text,
      }));
      await db.insert(promptCards).values(promptCardData);
    }

    if (existingVentures.length === 0) {
      // Import venture cards from the data file
      const { ventureCardData } = await import("../client/src/lib/game-data");
      const ventureCardsData = ventureCardData.map((card, index) => ({
        cardId: `venture_${index + 1}`,
        title: card.title,
        text: card.text,
        playWindow: card.playWindow || "pre",
      }));
      await db.insert(ventureCards).values(ventureCardsData);
    }
  }

  // Round methods
  async createRound(round: InsertRound): Promise<Round> {
    const [newRound] = await db.insert(rounds).values(round).returning();
    return newRound;
  }

  async getRound(id: number): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round || undefined;
  }

  async getRoundsByRoom(roomId: number): Promise<Round[]> {
    return await db.select().from(rounds).where(eq(rounds.roomId, roomId)).orderBy(desc(rounds.roundNo));
  }

  async updateRound(id: number, updates: Partial<Round>): Promise<Round> {
    const [round] = await db.update(rounds).set(updates).where(eq(rounds.id, id)).returning();
    return round;
  }

  // Pitch methods
  async createPitch(pitch: InsertPitch): Promise<Pitch> {
    const [newPitch] = await db.insert(pitches).values(pitch).returning();
    return newPitch;
  }

  async getPitchesByRound(roundId: number): Promise<Pitch[]> {
    return await db.select().from(pitches).where(eq(pitches.roundId, roundId));
  }

  // Vote methods
  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(votes).values(vote).returning();
    return newVote;
  }

  async getVotesByRound(roundId: number): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.roundId, roundId));
  }

  async getVoteByVoterAndRound(voterId: string, roundId: number): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(and(eq(votes.voterId, voterId), eq(votes.roundId, roundId)));
    return vote || undefined;
  }
}

export const storage = new DatabaseStorage();

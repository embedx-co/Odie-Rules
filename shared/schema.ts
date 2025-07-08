import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameRooms = pgTable("game_rooms", {
  id: serial("id").primaryKey(),
  roomPin: text("room_pin").notNull().unique(),
  hostId: text("host_id").notNull(),
  state: text("state").notNull().default("lobby"), // lobby | in_round | finished
  settings: jsonb("settings").notNull(),
  currentRound: integer("current_round").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull().unique(),
  roomId: integer("room_id").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  funding: integer("funding").default(0),
  isHost: boolean("is_host").default(false),
  isJudge: boolean("is_judge").default(false),
  isInvestor: boolean("is_investor").default(false),
  ventureCards: jsonb("venture_cards").default([]),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const promptCards = pgTable("prompt_cards", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull().unique(),
  text: text("text").notNull(),
});

export const ventureCards = pgTable("venture_cards", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull().unique(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  playWindow: text("play_window").notNull(), // pre | mid | post
});

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  roundNo: integer("round_no").notNull(),
  investorId: text("investor_id").notNull(),
  promptCard: jsonb("prompt_card").notNull(), // Single prompt for the round
  venturePlays: jsonb("venture_plays").default([]),
  pitches: jsonb("pitches").default([]),
  votes: jsonb("votes").default([]),
  investorChoice: text("investor_choice"), // Player ID chosen by investor
  winnerId: text("winner_id"), // Player who got the investment
  completedAt: timestamp("completed_at"),
});

export const pitches = pgTable("pitches", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  roundId: integer("round_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  voterId: text("voter_id").notNull(),
  candidateId: text("candidate_id").notNull(),
  roundId: integer("round_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const gameRoomsRelations = relations(gameRooms, ({ many }) => ({
  players: many(players),
  rounds: many(rounds),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  room: one(gameRooms, {
    fields: [players.roomId],
    references: [gameRooms.id],
  }),
  pitches: many(pitches),
  votes: many(votes),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  room: one(gameRooms, {
    fields: [rounds.roomId],
    references: [gameRooms.id],
  }),
  pitches: many(pitches),
  votes: many(votes),
}));

export const pitchesRelations = relations(pitches, ({ one }) => ({
  player: one(players, {
    fields: [pitches.playerId],
    references: [players.playerId],
  }),
  round: one(rounds, {
    fields: [pitches.roundId],
    references: [rounds.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  voter: one(players, {
    fields: [votes.voterId],
    references: [players.playerId],
  }),
  round: one(rounds, {
    fields: [votes.roundId],
    references: [rounds.id],
  }),
}));

// Insert schemas
export const insertGameRoomSchema = createInsertSchema(gameRooms).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true,
});

export const insertPromptCardSchema = createInsertSchema(promptCards).omit({
  id: true,
});

export const insertVentureCardSchema = createInsertSchema(ventureCards).omit({
  id: true,
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  completedAt: true,
});

export const insertPitchSchema = createInsertSchema(pitches).omit({
  id: true,
  timestamp: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true,
});

// Types
export type GameRoom = typeof gameRooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type PromptCard = typeof promptCards.$inferSelect;
export type VentureCard = typeof ventureCards.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type Pitch = typeof pitches.$inferSelect;
export type Vote = typeof votes.$inferSelect;

export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertPromptCard = z.infer<typeof insertPromptCardSchema>;
export type InsertVentureCard = z.infer<typeof insertVentureCardSchema>;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type InsertPitch = z.infer<typeof insertPitchSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;

// Game settings schema
export const gameSettingsSchema = z.object({
  maxPlayers: z.number().min(3).max(12).default(10),
  pitchTimerSec: z.number().min(30).max(180).default(120),
  presentationTimerSec: z.number().min(30).max(120).default(60),
  investmentAmountBillion: z.number().min(0.1).max(5).default(1), // Investment amount in billions
  fundingTargetBillion: z.number().min(1).default(5),
  maxRounds: z.number().optional(),
  ventureCardsPerPlayer: z.number().min(1).max(5).default(2),
  allowAudienceObservers: z.boolean().default(true),
  investorSelectionTimerSec: z.number().min(15).max(60).default(30),
  votingTimerSec: z.number().min(15).max(60).default(30),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

// Remove the old users table exports
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

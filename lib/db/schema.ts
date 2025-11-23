import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const questions = pgTable("questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(), // 'SINGLE', 'MULTIPLE', 'JUDGE'
  content: text("content").notNull(),
  options: text("options").notNull(), // JSON string of options
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  mnemonic: text("mnemonic"),
  category: text("category"),
  keywords: text("keywords"), // JSON string array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  questionId: integer("questionId")
    .notNull()
    .references(() => questions.id),
  userAnswer: text("userAnswer"),
  isCorrect: boolean("isCorrect").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userQuestionState = pgTable("user_question_state", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  questionId: integer("questionId")
    .notNull()
    .references(() => questions.id),
  isCollected: boolean("isCollected").default(false).notNull(),
  wrongCount: integer("wrongCount").default(0).notNull(),
  correctCount: integer("correctCount").default(0).notNull(),
  note: text("note"),
  lastAnsweredAt: timestamp("lastAnsweredAt"),
});

export const mockExamScores = pgTable("mock_exam_scores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  score: integer("score").notNull(),
  totalQuestions: integer("totalQuestions").notNull(),
  correctCount: integer("correctCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

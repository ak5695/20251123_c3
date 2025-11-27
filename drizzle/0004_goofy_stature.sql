ALTER TABLE "user_question_state" ADD COLUMN "isRecited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_question_state" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_question_state" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;
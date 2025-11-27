CREATE TABLE "mock_exam_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"score" integer NOT NULL,
	"totalQuestions" integer NOT NULL,
	"correctCount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"stripeSessionId" text,
	"stripePaymentIntentId" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'cny' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripeSessionId_unique" UNIQUE("stripeSessionId")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isPaid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscriptionExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripeCustomerId" text;--> statement-breakpoint
ALTER TABLE "user_question_state" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "mock_exam_scores" ADD CONSTRAINT "mock_exam_scores_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
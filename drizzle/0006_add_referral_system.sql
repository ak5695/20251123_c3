CREATE TABLE "referral_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"referrerId" text NOT NULL,
	"refereeId" text NOT NULL,
	"rewardDays" integer DEFAULT 5 NOT NULL,
	"referrerRewarded" boolean DEFAULT false,
	"refereeRewarded" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referralCode" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referredBy" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referralRewardClaimed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrerId_user_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_refereeId_user_id_fk" FOREIGN KEY ("refereeId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_referralCode_unique" UNIQUE("referralCode");
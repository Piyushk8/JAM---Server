CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"room_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"livekit_room_id" text NOT NULL,
	"max_Participants" integer DEFAULT 20 NOT NULL,
	"videoQuality" "videoQuality" DEFAULT 'medium'
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "room_users" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "room_users" ALTER COLUMN "room_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "room_users" ALTER COLUMN "user_id" SET DATA TYPE text;
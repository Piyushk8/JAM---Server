CREATE TYPE "public"."videoQuality" AS ENUM('high', 'low', 'medium');--> statement-breakpoint
CREATE TABLE "room_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid,
	"user_id" uuid,
	"session_id" text NOT NULL,
	"is_connected" boolean DEFAULT false,
	"video_enabled" boolean DEFAULT true,
	"audio_enabled" boolean DEFAULT true,
	"last_active" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"livekit_room_id" text NOT NULL,
	"max_Participants" integer DEFAULT 20 NOT NULL,
	"videoQuality" "videoQuality" DEFAULT 'medium'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"password" text NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");
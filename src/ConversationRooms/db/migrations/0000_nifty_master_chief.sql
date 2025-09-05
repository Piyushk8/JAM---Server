CREATE TYPE "public"."videoQuality" AS ENUM('high', 'low', 'medium');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer,
	"user_id" integer,
	"session_id" text NOT NULL,
	"is_connected" boolean DEFAULT false,
	"video_enabled" boolean DEFAULT true,
	"audio_enabled" boolean DEFAULT true,
	"last_active" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
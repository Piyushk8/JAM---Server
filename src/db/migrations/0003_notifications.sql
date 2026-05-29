CREATE TYPE "public"."notificationStatus" AS ENUM('unread', 'read');
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"room_id" uuid,
	"actor_id" uuid,
	"actor_name" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"status" "notificationStatus" DEFAULT 'unread' NOT NULL,
	"action_section" text,
	"entity_type" text,
	"entity_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "notifications_recipient_status_idx" ON "notifications" USING btree ("recipient_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "notifications_room_idx" ON "notifications" USING btree ("room_id");

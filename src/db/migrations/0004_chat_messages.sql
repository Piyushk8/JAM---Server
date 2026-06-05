CREATE TYPE "public"."chatMessageScope" AS ENUM('room', 'nearby', 'direct');
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_name" text NOT NULL,
	"recipient_id" uuid,
	"recipient_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scope" "chatMessageScope" DEFAULT 'room' NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"body" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "chat_messages_room_scope_created_idx" ON "chat_messages" USING btree ("room_id","scope","created_at");
--> statement-breakpoint
CREATE INDEX "chat_messages_direct_idx" ON "chat_messages" USING btree ("room_id","sender_id","recipient_id","created_at");

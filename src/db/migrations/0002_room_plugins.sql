CREATE TABLE "room_plugins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"plugin_id" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plugin_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"plugin_id" text NOT NULL,
	"state_key" text NOT NULL,
	"state_json" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "room_plugins" ADD CONSTRAINT "room_plugins_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "plugin_state" ADD CONSTRAINT "plugin_state_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "room_plugins_room_plugin_idx" ON "room_plugins" USING btree ("room_id","plugin_id");
--> statement-breakpoint
CREATE INDEX "room_plugins_room_idx" ON "room_plugins" USING btree ("room_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_state_room_plugin_key_idx" ON "plugin_state" USING btree ("room_id","plugin_id","state_key");
--> statement-breakpoint
CREATE INDEX "plugin_state_room_idx" ON "plugin_state" USING btree ("room_id");

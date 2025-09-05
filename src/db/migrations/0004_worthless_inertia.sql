ALTER TABLE "room_users" DROP CONSTRAINT "room_users_room_id_rooms_id_fk";
--> statement-breakpoint
ALTER TABLE "room_users" DROP CONSTRAINT "room_users_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "room_users" ALTER COLUMN "room_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "room_users" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
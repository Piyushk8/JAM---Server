ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
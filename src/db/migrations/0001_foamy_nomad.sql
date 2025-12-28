CREATE TYPE "public"."roomTheme" AS ENUM('basicoffice', 'largeoffice');--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "theme" "roomTheme" NOT NULL;
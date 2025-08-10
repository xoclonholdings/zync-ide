CREATE TABLE IF NOT EXISTS "files" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"content" text,
	"projectId" integer,
	"isDirectory" integer,
	"createdAt" text,
	"updatedAt" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integrations" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" text,
	"apiKey" text,
	"isActive" integer,
	"userId" integer,
	"createdAt" text,
	"updatedAt" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"description" text,
	"template" text,
	"userId" integer,
	"createdAt" text,
	"updatedAt" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"userId" integer,
	"token" text NOT NULL,
	"expiresAt" text NOT NULL,
	"createdAt" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"createdAt" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" ("username");
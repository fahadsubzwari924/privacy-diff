CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"url_hash" text NOT NULL,
	"week_bucket" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"final_url" text,
	"page_title" text,
	"unprotected_requests" integer,
	"unprotected_bytes" bigint,
	"unprotected_load_ms" integer,
	"protected_requests" integer,
	"protected_bytes" bigint,
	"protected_load_ms" integer,
	"blocked_requests" jsonb,
	"companies" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reports_cache_idx" ON "reports" USING btree ("url_hash","week_bucket");
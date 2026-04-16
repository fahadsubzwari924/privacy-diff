CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limits_ip_created_idx" ON "rate_limits" USING btree ("ip_hash","created_at");
ALTER TABLE "product_customizations" ALTER COLUMN "font_size" SET DEFAULT '1rem';--> statement-breakpoint
ALTER TABLE "product_customizations" ADD COLUMN "banner_container" text DEFAULT 'body' NOT NULL;
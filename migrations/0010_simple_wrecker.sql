CREATE TABLE `page-content` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false,
	`title` text,
	`description` text,
	`createdOn` integer,
	`updatedOn` integer
);
--> statement-breakpoint
CREATE TABLE `page-now` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false,
	`title` text,
	`description` text,
	`createdOn` integer,
	`updatedOn` integer
);
--> statement-breakpoint
CREATE TABLE `page-uses` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false,
	`title` text,
	`description` text,
	`uses` text,
	`createdOn` integer,
	`updatedOn` integer
);
--> statement-breakpoint
ALTER TABLE `home` RENAME TO `page-home`;--> statement-breakpoint
ALTER TABLE posts ADD `type` text;--> statement-breakpoint
ALTER TABLE posts ADD `icon` text;
CREATE TABLE `home` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false,
	`title` text,
	`description` text,
	`tags` text,
	`body` text,
	`images` text,
	`createdOn` integer,
	`updatedOn` integer
);

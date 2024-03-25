CREATE TABLE `pageTimeline` (
	`id` text PRIMARY KEY NOT NULL,
	`active` integer DEFAULT false,
	`date` text,
	`title` text,
	`description` text,
	`icon` text,
	`image` text,
	`createdOn` integer,
	`updatedOn` integer
);

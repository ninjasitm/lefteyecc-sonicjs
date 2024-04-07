ALTER TABLE
    `posts` RENAME COLUMN `post_type` TO `postType`;

ALTER TABLE
    pageTimeline
ADD
    `iconColor` text;

--> statement-breakpoint
ALTER TABLE
    pageTimeline
ADD
    `chipText` text;

--> statement-breakpoint
ALTER TABLE
    pageTimeline
ADD
    `chipColor` text;

--> statement-breakpoint
ALTER TABLE
    posts
ADD
    `publishedOn` text;
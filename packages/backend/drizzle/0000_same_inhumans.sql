CREATE TABLE `authelia_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`order` integer NOT NULL,
	`policy` text NOT NULL,
	`resources` text,
	`subject` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `caddy_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`order` integer NOT NULL,
	`auth` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `caddy_config_project_id_unique` ON `caddy_config` (`project_id`);--> statement-breakpoint
CREATE TABLE `containers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `containers_name_unique` ON `containers` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_container_type_per_project` ON `containers` (`project_id`,`type`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`github` text NOT NULL,
	`main_url` text NOT NULL,
	`more_urls` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_authelia_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`standalone_container_id` integer,
	`order` integer NOT NULL,
	`policy` text NOT NULL,
	`resources` text,
	`subject` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`standalone_container_id`) REFERENCES `containers`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_authelia_config`(`id`, `project_id`, `order`, `policy`, `resources`, `subject`) SELECT `id`, `project_id`, `order`, `policy`, `resources`, `subject` FROM `authelia_config`;--> statement-breakpoint
DROP TABLE `authelia_config`;--> statement-breakpoint
ALTER TABLE `__new_authelia_config` RENAME TO `authelia_config`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
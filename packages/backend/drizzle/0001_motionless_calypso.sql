PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_containers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`name` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_containers`("id", "project_id", "name", "type") SELECT "id", "project_id", "name", "type" FROM `containers`;--> statement-breakpoint
DROP TABLE `containers`;--> statement-breakpoint
ALTER TABLE `__new_containers` RENAME TO `containers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `containers_name_unique` ON `containers` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_container_type_per_project` ON `containers` (`project_id`,`type`);
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `caddy_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`standalone_container_id` integer,
	`order` integer NOT NULL,
	`auth` text NOT NULL,
	`is_provider` integer GENERATED ALWAYS AS (CASE WHEN "auth" = 'provider' THEN 1 ELSE NULL END) VIRTUAL,
	`standalone_container_domain` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`standalone_container_id`) REFERENCES `containers`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "xor_project_container" CHECK(("caddy_config"."project_id" IS NOT NULL AND "caddy_config"."standalone_container_id" IS NULL) OR ("caddy_config"."project_id" IS NULL AND "caddy_config"."standalone_container_id" IS NOT NULL)),
	CONSTRAINT "standalone_container_has_domain" CHECK(("caddy_config"."standalone_container_id" IS NULL AND "caddy_config"."standalone_container_domain" IS NULL) OR ("caddy_config"."standalone_container_id" IS NOT NULL AND "caddy_config"."standalone_container_domain" IS NOT NULL))
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `caddy_config_project_id_unique` ON `caddy_config` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `caddy_config_standalone_container_id_unique` ON `caddy_config` (`standalone_container_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `caddy_config_order_unique` ON `caddy_config` (`order`);--> statement-breakpoint
CREATE UNIQUE INDEX `caddy_config_is_provider_unique` ON `caddy_config` (`is_provider`);--> statement-breakpoint

CREATE TABLE `__new_containers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer,
	`name` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "standalone_without_project" CHECK("__new_containers"."type" != 'standalone' OR "__new_containers"."project_id" IS NULL),
	CONSTRAINT "project_required_for_non_standalone" CHECK("__new_containers"."type" = 'standalone' OR "__new_containers"."project_id" IS NOT NULL),
	CONSTRAINT "valid_container_type" CHECK("__new_containers"."type" IN ('frontend', 'backend', 'database', 'docker-proxy', 'standalone'))
);
--> statement-breakpoint
INSERT INTO `__new_containers`("id", "project_id", "name", "type") SELECT "id", "project_id", "name", "type" FROM `containers`;--> statement-breakpoint
DROP TABLE `containers`;--> statement-breakpoint
ALTER TABLE `__new_containers` RENAME TO `containers`;--> statement-breakpoint
CREATE UNIQUE INDEX `containers_name_unique` ON `containers` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_container_type_per_project` ON `containers` (`project_id`,`type`);

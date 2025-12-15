CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','warning','error','success') DEFAULT 'info',
	`category` enum('backup','security','system','user','import') DEFAULT 'system',
	`isRead` boolean DEFAULT false,
	`actionUrl` varchar(500),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_notifications` ADD CONSTRAINT `admin_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
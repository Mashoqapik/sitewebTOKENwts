CREATE TABLE `vault_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(512) NOT NULL,
	`type` enum('file','folder') NOT NULL,
	`parentId` int,
	`s3Key` varchar(1024),
	`s3Url` text,
	`mimeType` varchar(256),
	`fileSize` bigint,
	`lastAccessedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vault_items_id` PRIMARY KEY(`id`)
);

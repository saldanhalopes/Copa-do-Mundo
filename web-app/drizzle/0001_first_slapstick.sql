CREATE TABLE `battles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengerId` int NOT NULL,
	`opponentId` int NOT NULL,
	`challengerCards` json NOT NULL,
	`opponentCards` json NOT NULL,
	`winnerId` int,
	`betAmount` float DEFAULT 0,
	`eloChange` int DEFAULT 0,
	`season` int NOT NULL DEFAULT 1,
	`result` json,
	`status` enum('pending','active','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `battles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`teamId` varchar(8) NOT NULL,
	`teamName` varchar(64) NOT NULL,
	`position` varchar(8) NOT NULL,
	`rarity` enum('comum','rara','epica','lendaria') NOT NULL,
	`pac` int NOT NULL,
	`sho` int NOT NULL,
	`pas` int NOT NULL,
	`dri` int NOT NULL,
	`def` int NOT NULL,
	`phy` int NOT NULL,
	`ovr` int NOT NULL,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `cards_tokenId_unique` UNIQUE(`tokenId`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`cardId` int NOT NULL,
	`price` float NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'POL',
	`chain` enum('polygon','bnb') NOT NULL DEFAULT 'polygon',
	`status` enum('active','sold','cancelled') NOT NULL DEFAULT 'active',
	`buyerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`soldAt` timestamp,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('basico','premium','lendario') NOT NULL,
	`userId` int NOT NULL,
	`opened` boolean NOT NULL DEFAULT false,
	`openedAt` timestamp,
	`cardsReceived` json,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeOffers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initiatorId` int NOT NULL,
	`receiverId` int NOT NULL,
	`initiatorCardIds` json NOT NULL,
	`receiverCardIds` json NOT NULL,
	`status` enum('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `tradeOffers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `selectedChain` enum('polygon','bnb') DEFAULT 'polygon';--> statement-breakpoint
ALTER TABLE `users` ADD `elo` int DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `wins` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `losses` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `season` int DEFAULT 1 NOT NULL;
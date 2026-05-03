-- Plasma Database Schema
-- Intent Modes for Social Signaling
CREATE TYPE intent_mode AS ENUM ('COMPETITIVE', 'CHILL', 'OFFLINE');

-- RSVP Status for The Rally
CREATE TYPE rsvp_status AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- Platform definitions for The Omni-Library
CREATE TYPE platform_type AS ENUM ('STEAM', 'RIOT', 'EPIC', 'BATTLE_NET', 'NON_STEAM', 'IGDB');

-- Claim States for The Prestige manual milestones
CREATE TYPE claim_state AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Post Types for The Pulse feed
CREATE TYPE post_type AS ENUM ('MOMENT', 'ACHIEVEMENT_UNLOCK', 'ACTIVITY_UPDATE', 'RALLY_BROADCAST');


CREATE TABLE "users" (
    "plasmaUserID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "steamID64" VARCHAR(17) UNIQUE,
    "email" VARCHAR(255) UNIQUE,
    "passwordHash" VARCHAR(255),
    "dateOfBirth" DATE,
    "username" VARCHAR(255) UNIQUE NOT NULL,
    "intent" intent_mode DEFAULT 'OFFLINE',
    "accountAgeDays" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "profiles" (
    "profileID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "plasmaUserID" UUID UNIQUE NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "bio" TEXT,
    "avatarURL" TEXT,
    "totalPlasmaXP" INTEGER DEFAULT 0,
    -- Steam-synced fields from GetPlayerSummaries
    "steamPersonaName" VARCHAR(255),
    "steamProfileURL" TEXT,
    "lastLogoff" TIMESTAMP WITH TIME ZONE,
    "steamMemberSince" TIMESTAMP WITH TIME ZONE,
    "countryCode" VARCHAR(2),
    "isSteamProfilePrivate" BOOLEAN DEFAULT false
);

CREATE TABLE "follow_relationships" (
    "followID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "followerID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "followedID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "followedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "isMutual" BOOLEAN DEFAULT FALSE,
    UNIQUE("followerID", "followedID") -- Prevents users from following the same person twice
);

CREATE TABLE "rally_events" (
    "eventID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizerID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scheduledStartUTC" TIMESTAMP WITH TIME ZONE NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "requiredIntent" intent_mode DEFAULT 'CHILL',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "rsvps" (
    "rsvpID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "eventID" UUID NOT NULL REFERENCES "rally_events"("eventID") ON DELETE CASCADE,
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "declaredRole" VARCHAR(50), 
    "status" rsvp_status DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("eventID", "userID") -- One user can only RSVP once per event
);

CREATE TABLE "games" (
    "appID" VARCHAR(50) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "platform" platform_type NOT NULL,
    "isManualEntry" BOOLEAN DEFAULT FALSE,
    "coverArtURL" TEXT
);

CREATE TABLE "library_entries" (
    "entryID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "appID" VARCHAR(50) NOT NULL REFERENCES "games"("appID") ON DELETE CASCADE,
    "hoursPlayed" REAL DEFAULT 0.0,
    "isCurrentlyPlaying" BOOLEAN DEFAULT FALSE,
    "lastPlayedAt" TIMESTAMP WITH TIME ZONE,
    UNIQUE("userID", "appID")
);

CREATE TABLE "achievements" (
    "achievementID" VARCHAR(100) PRIMARY KEY,
    "appID" VARCHAR(50) NOT NULL REFERENCES "games"("appID") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "rarityWeight" REAL NOT NULL,
    "plasmaXP" INTEGER NOT NULL,
    "globalPercentage" REAL
);

CREATE TABLE "user_achievements" (
    "claimID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "achievementID" VARCHAR(100) NOT NULL REFERENCES "achievements"("achievementID") ON DELETE CASCADE,
    "isPinned" BOOLEAN DEFAULT FALSE, 
    "claimState" claim_state DEFAULT 'VERIFIED', 
    "unlockedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userID", "achievementID")
);

CREATE TABLE "peer_endorsements" (
    "endorsementID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "claimID" UUID NOT NULL REFERENCES "user_achievements"("claimID") ON DELETE CASCADE,
    "endorserID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "screenshotProofURL" TEXT,
    "status" claim_state DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "posts" (
    "postID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "type" post_type NOT NULL,
    "content" TEXT,
    "mediaURL" TEXT,
    "timestampUTC" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deepLinkURI" TEXT,
    "isVisible" BOOLEAN DEFAULT TRUE
);

CREATE TABLE "comments" (
    "commentID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "postID" UUID NOT NULL REFERENCES "posts"("postID") ON DELETE CASCADE,
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "text" TEXT NOT NULL,
    "timestampUTC" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user_settings" (
    "plasmaUserID" UUID PRIMARY KEY REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "notificationsEnabled" BOOLEAN DEFAULT TRUE,
    "timezone" VARCHAR(100) DEFAULT 'UTC',
    "privacy" VARCHAR(50) DEFAULT 'Public',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "post_reactions" (
    "reactionID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "postID" UUID NOT NULL REFERENCES "posts"("postID") ON DELETE CASCADE,
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "reactionType" VARCHAR(50) DEFAULT 'LIKE',
    "timestampUTC" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("postID", "userID")
);

CREATE TABLE "notifications" (
    "notificationID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "receiverID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "senderID" UUID REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "notificationType" VARCHAR(50) NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN DEFAULT FALSE,
    "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "push_subscriptions" (
    "subscriptionID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userID", "endpoint")
);

CREATE TABLE "direct_messages" (
    "messageID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "senderID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "receiverID" UUID NOT NULL REFERENCES "users"("plasmaUserID") ON DELETE CASCADE,
    "content" TEXT,
    "isLobbyInvite" BOOLEAN DEFAULT FALSE,
    "lobbyLink" TEXT,
    "timestampUTC" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

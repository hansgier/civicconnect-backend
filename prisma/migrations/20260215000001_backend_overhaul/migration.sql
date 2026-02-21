-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('INSTITUTIONAL', 'TRANSPORTATION', 'HEALTH', 'WATER', 'EDUCATION', 'SOCIAL', 'INFRASTRUCTURE', 'SPORTS_AND_RECREATION', 'ECONOMIC');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "category" "ProjectCategory";

-- Map Tag Names to Categories (Data Transformation)
UPDATE projects p
SET category = CASE t.name
  WHEN 'Institutional' THEN 'INSTITUTIONAL'
  WHEN 'Transportation' THEN 'TRANSPORTATION'
  WHEN 'Health' THEN 'HEALTH'
  WHEN 'Water' THEN 'WATER'
  WHEN 'Education' THEN 'EDUCATION'
  WHEN 'Social' THEN 'SOCIAL'
  WHEN 'Infrastructure' THEN 'INFRASTRUCTURE'
  WHEN 'Sports and Recreation' THEN 'SPORTS_AND_RECREATION'
  WHEN 'Economic' THEN 'ECONOMIC'
  ELSE NULL
END::"ProjectCategory"
FROM project_tags pt
JOIN tags t ON pt."tagId" = t.id
WHERE pt."projectId" = p.id;

-- CreateEnum
CREATE TYPE "AnnouncementCategory" AS ENUM ('EVENT', 'SAFETY', 'POLICY', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL', 'COMMENT', 'UPDATE', 'ANNOUNCEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('EMERGENCY', 'GOVERNMENT', 'HEALTH', 'EDUCATION', 'ENVIRONMENT', 'BUSINESS', 'WATER', 'ELECTRICITY');

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('ONGOING', 'COMPLETED', 'CANCELLED', 'ON_HOLD', 'PLANNED', 'APPROVED_PROPOSAL');
ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING (CASE WHEN "status"::text = 'PENDING' THEN 'PLANNED' ELSE "status"::text END)::"ProjectStatus_new";
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "ProjectStatus_old";
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
COMMIT;

-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_projectUpdateId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_userId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "project_tags" DROP CONSTRAINT "project_tags_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_tags" DROP CONSTRAINT "project_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "isOfficial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "media" DROP COLUMN "projectUpdateId";

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "category" "AnnouncementCategory",
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT;

-- DropTable
DROP TABLE "contacts";

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phoneNumbers" TEXT[],
    "primaryPhone" TEXT,
    "emails" TEXT[],
    "schedule" TEXT,
    "location" TEXT,
    "type" "ContactType" NOT NULL,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "conversation_participants";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "tags";

-- DropTable
DROP TABLE "project_tags";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "announcementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebookId_key" ON "users"("facebookId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


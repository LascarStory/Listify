-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "adminToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckMark" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_shareToken_key" ON "Schedule"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_adminToken_key" ON "Schedule"("adminToken");

-- CreateIndex
CREATE UNIQUE INDEX "CheckMark_itemId_nickname_key" ON "CheckMark"("itemId", "nickname");

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckMark" ADD CONSTRAINT "CheckMark_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

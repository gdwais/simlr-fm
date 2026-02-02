-- CreateTable
CREATE TABLE "RushmoreSlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "albumId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RushmoreSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RushmoreSlot_userId_idx" ON "RushmoreSlot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RushmoreSlot_userId_slot_key" ON "RushmoreSlot"("userId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "RushmoreSlot_userId_albumId_key" ON "RushmoreSlot"("userId", "albumId");

-- AddForeignKey
ALTER TABLE "RushmoreSlot" ADD CONSTRAINT "RushmoreSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RushmoreSlot" ADD CONSTRAINT "RushmoreSlot_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

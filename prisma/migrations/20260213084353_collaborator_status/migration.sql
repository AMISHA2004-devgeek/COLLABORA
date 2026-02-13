-- AlterTable
ALTER TABLE "NotebookCollaborator" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "NotebookCollaborator_email_idx" ON "NotebookCollaborator"("email");

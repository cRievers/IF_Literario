-- AlterTable
ALTER TABLE "turmas" ADD COLUMN     "templateOrientadorId" INTEGER;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_templateOrientadorId_fkey" FOREIGN KEY ("templateOrientadorId") REFERENCES "templates_avaliacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

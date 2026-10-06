import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Resequencing all receipts to 5-digit format (00001, 00002, ...)...");

  const payments = await prisma.payment.findMany({
    orderBy: [
      { paymentDate: "asc" },
      { createdAt: "asc" },
    ],
  });

  console.log(`Found ${payments.length} payment records.`);

  const toUpdate: { id: string; oldReceiptNo: string; newReceiptNo: string }[] = [];

  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    const generatedNo = (i + 1).toString().padStart(5, "0");
    toUpdate.push({
      id: p.id,
      oldReceiptNo: p.receiptNo,
      newReceiptNo: generatedNo,
    });
  }

  if (toUpdate.length > 0) {
    const timestamp = Date.now();
    // Phase 1: temporary receipt numbers to avoid unique collisions
    const phase1All = toUpdate.map((item, i) =>
      prisma.payment.update({
        where: { id: item.id },
        data: { receiptNo: `__TEMP_5DIGIT_${timestamp}_${i}__` },
      })
    );

    // Phase 2: assign 5-digit numbers
    const phase2All = toUpdate.map((item) =>
      prisma.payment.update({
        where: { id: item.id },
        data: { receiptNo: item.newReceiptNo },
      })
    );

    await prisma.$transaction([...phase1All, ...phase2All]);
    console.log(`Successfully updated ${toUpdate.length} receipts to 5-digit sequential numbers:`);
    for (const item of toUpdate) {
      console.log(` - ${item.oldReceiptNo} -> ${item.newReceiptNo}`);
    }
  } else {
    console.log("No receipts to update.");
  }
}

main()
  .catch((e) => {
    console.error("Error resequencing receipts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

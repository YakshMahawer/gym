import { NextRequest, NextResponse } from "next/server";
import { getReceiptPdfBuffer } from "@/lib/pdf-receipt";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing receipt ID" }, { status: 400 });
    }

    const result = await getReceiptPdfBuffer(id);
    if (!result) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Return application/pdf for WhatsApp Business API and direct downloads
    return new NextResponse(Buffer.from(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error generating receipt PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt PDF" },
      { status: 500 }
    );
  }
}

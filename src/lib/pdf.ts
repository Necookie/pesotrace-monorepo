import "server-only";
import PDFDocument from "pdfkit";
import type { Database } from "@/lib/database.types";
import { last4Ref } from "@/lib/schemas/transaction";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

const COLUMNS = [
  { key: "date", label: "Date", width: 55 },
  { key: "time", label: "Time", width: 50 },
  { key: "ref", label: "Reference / CP #", width: 110 },
  { key: "cashIn", label: "Cash In", width: 65 },
  { key: "cashOut", label: "Cash Out", width: 65 },
  { key: "load", label: "Load", width: 55 },
  { key: "amount", label: "Amount", width: 70 },
  { key: "fee", label: "Service Fee", width: 65 },
  { key: "last4", label: "Last 4 Ref #", width: 60 },
] as const;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

function peso(value: number | string): string {
  if (value === "") return "";
  return `P${Number(value).toFixed(2)}`;
}

/**
 * Same column layout as transactionsToCsv, rendered as a printable table —
 * matches the store's own paper daily-summary sheet so this can be printed
 * or cross-checked directly against their existing process.
 */
export function transactionsToPdf(
  rows: Row[],
  opts: { storeName: string; from: string; to: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 36 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const tableWidth = COLUMNS.reduce((sum, c) => sum + c.width, 0);
    const startX = doc.page.margins.left + Math.max(0, (pageWidth - tableWidth) / 2);
    const rowHeight = 20;

    function drawHeader() {
      doc.fontSize(16).font("Helvetica-Bold").text(opts.storeName, startX, doc.y);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Transactions ${opts.from} to ${opts.to}`, startX, doc.y + 2);
      doc.text(`Generated ${new Date().toISOString().slice(0, 10)}`, startX, doc.y + 2);
      doc.moveDown(1);
    }

    function drawTableHeader() {
      let x = startX;
      const y = doc.y;
      doc.fontSize(9).font("Helvetica-Bold");
      for (const col of COLUMNS) {
        doc.text(col.label, x + 2, y + 4, { width: col.width - 4 });
        x += col.width;
      }
      doc
        .moveTo(startX, y + rowHeight)
        .lineTo(startX + tableWidth, y + rowHeight)
        .strokeColor("#dee1e6")
        .stroke();
      doc.y = y + rowHeight;
    }

    function ensureSpace() {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawTableHeader();
      }
    }

    drawHeader();
    drawTableHeader();

    doc.font("Helvetica").fontSize(8.5);
    let totalFees = 0;

    for (const row of rows) {
      ensureSpace();
      const y = doc.y;
      const cashIn = row.category === "cash_in" ? row.amount : "";
      const cashOut = row.category === "cash_out" ? row.amount : "";
      const load = row.category === "load" ? row.amount : "";
      totalFees += Number(row.fee_computed);

      const values: Record<(typeof COLUMNS)[number]["key"], string> = {
        date: row.occurred_at.slice(0, 10),
        time: formatTime(row.occurred_at),
        ref: row.counterparty_number || row.ref_number,
        cashIn: peso(cashIn),
        cashOut: peso(cashOut),
        load: peso(load),
        amount: peso(row.amount),
        fee: peso(row.fee_computed),
        last4: `...${last4Ref(row.ref_number)}`,
      };

      let x = startX;
      for (const col of COLUMNS) {
        doc.text(values[col.key], x + 2, y + 4, { width: col.width - 4 });
        x += col.width;
      }
      doc
        .moveTo(startX, y + rowHeight)
        .lineTo(startX + tableWidth, y + rowHeight)
        .strokeColor("#eef0f3")
        .stroke();
      doc.y = y + rowHeight;
    }

    ensureSpace();
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total transactions: ${rows.length}`, startX, doc.y);
    doc.text(`Total service fees: ${peso(totalFees)}`, startX, doc.y + 2);

    doc.end();
  });
}

import { NextResponse } from "next/server";
import { runLowBalanceSweep } from "./run";
import { captureException } from "@/lib/monitoring-server";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runLowBalanceSweep();
    return NextResponse.json(result);
  } catch (error) {
    await captureException(error, "server", { route: "api/cron/low-balance" });
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}

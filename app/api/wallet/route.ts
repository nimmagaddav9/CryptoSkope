import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, message: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/wallet/connect`, {
      method: 'POST', // POST /api/wallet receives { address } from the frontend
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    const data = await res.json().catch(() => ({
      success: false,
      message: 'Wallet service returned an invalid response',
    }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to save wallet address' },
      { status: 500 }
    );
  }
}

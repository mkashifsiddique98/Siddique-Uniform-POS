import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch('http://localhost:3001/print-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    return NextResponse.json({ message: data.message }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Failed to print receipt', error: error.message }, { status: 500 });
  }
}

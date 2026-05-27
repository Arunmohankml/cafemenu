import { NextResponse } from 'next/server';

// Use global object for persistence across hot reloads in dev mode
const globalAny: any = global;
if (!globalAny.orders) {
  globalAny.orders = [];
}

export async function GET() {
  // Sort newest first
  const sortedOrders = [...globalAny.orders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(sortedOrders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newOrder = {
      id: Math.random().toString(36).substring(2, 9),
      ...body,
      status: 'Received',
      createdAt: new Date().toISOString(),
    };
    
    globalAny.orders.push(newOrder);
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Additional route logic to clear or seed data if needed

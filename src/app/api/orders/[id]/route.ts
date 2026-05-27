import { NextResponse } from 'next/server';

// We share the orders array by mutating the imported variable, but since Next.js API routes 
// can be re-instantiated in dev mode, we'll use global object for persistence across hot reloads.
const globalAny: any = global;
if (!globalAny.orders) {
  globalAny.orders = [];
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const orderIndex = globalAny.orders.findIndex((o: any) => o.id === params.id);
    
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    globalAny.orders[orderIndex] = {
      ...globalAny.orders[orderIndex],
      ...body,
    };
    
    return NextResponse.json(globalAny.orders[orderIndex]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

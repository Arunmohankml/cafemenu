import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ status: 'success' });
  response.cookies.set('session', '', {
    maxAge: 0,
    path: '/',
  });
  return response;
}

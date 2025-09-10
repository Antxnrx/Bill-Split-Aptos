import { NextResponse } from 'next/server';

// In-memory bill sessions demo (replace with DB in prod)
let sessions = {};

export async function GET(request, { params }) {
  try {
    const { sessionId } = params;

    if (!sessions[sessionId]) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(sessions[sessionId]);
  } catch (err) {
    console.error('Get status error:', err);
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}

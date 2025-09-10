import { NextResponse } from 'next/server';

// In-memory bill sessions demo (replace with DB in prod)
let sessions = {};

export async function POST(request, { params }) {
  try {
    const { sessionId } = params;

    if (!sessions[sessionId]) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    sessions[sessionId].finalized = true;

    return NextResponse.json({ 
      message: 'Session finalized', 
      session: sessions[sessionId] 
    });
  } catch (err) {
    console.error('Finalize error:', err);
    return NextResponse.json(
      { error: 'Failed to finalize session' },
      { status: 500 }
    );
  }
}

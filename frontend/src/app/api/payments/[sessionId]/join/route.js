import { NextResponse } from 'next/server';

// In-memory bill sessions demo (replace with DB in prod)
let sessions = {};

export async function POST(request, { params }) {
  try {
    const { sessionId } = params;
    const { participantAddress } = await request.json();

    if (!sessions[sessionId]) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (sessions[sessionId].participants.length >= sessions[sessionId].participantCount) {
      return NextResponse.json(
        { error: 'Participant limit reached' },
        { status: 400 }
      );
    }

    if (sessions[sessionId].participants.includes(participantAddress)) {
      return NextResponse.json(
        { error: 'Participant already added' },
        { status: 400 }
      );
    }

    sessions[sessionId].participants.push(participantAddress);

    return NextResponse.json({ 
      message: 'Participant added', 
      participants: sessions[sessionId].participants 
    });
  } catch (err) {
    console.error('Join session error:', err);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}

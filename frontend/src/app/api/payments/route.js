import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import aptosService from '@/lib/aptos-service';

// In-memory bill sessions demo (replace with DB in prod)
let sessions = {};

export async function POST(request) {
  try {
    const { totalAmount, participantCount, description } = await request.json();

    if (!totalAmount || !participantCount || participantCount < 1) {
      return NextResponse.json(
        { error: 'Invalid total amount or participants' },
        { status: 400 }
      );
    }

    const sessionId = uuidv4();

    // Create bill session object
    sessions[sessionId] = {
      totalAmount,
      participantCount,
      description: description || '',
      participants: [],
      finalized: false,
      paidParticipants: []
    };

    // Generate QR code for sessionId
    const qrCodeData = await QRCode.toDataURL(sessionId);

    // TODO: Integrate with real Aptos contract when deployed
    // const aptosResult = await aptosService.createBillSession(
    //   sessionId, 
    //   totalAmount, 
    //   participantAddresses, 
    //   participantNames, 
    //   requiredSignatures
    // );

    return NextResponse.json({ 
      sessionId, 
      qrCodeData,
      message: 'Session created successfully. Ready for Aptos integration when contracts are deployed.'
    });
  } catch (err) {
    console.error('Create session error:', err);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Payments API is running' });
}

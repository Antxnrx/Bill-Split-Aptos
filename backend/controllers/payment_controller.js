const express = require('express');
const { v4: uuidv4 } = require('uuid');
const qrcode = require('qrcode');
const aptosService = require('../services/aptos_service');

const router = express.Router();

let sessions = {}; // In-memory bill sessions demo (replace with DB in prod)

router.post('/create', async (req, res) => {
  try {
    const { totalAmount, participantCount, description } = req.body;

    if (!totalAmount || !participantCount || participantCount < 1) {
      return res.status(400).json({ error: 'Invalid total amount or participants' });
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
    const qrCodeData = await qrcode.toDataURL(sessionId);

    res.json({ sessionId, qrCodeData });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/:sessionId/join', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantAddress } = req.body;

    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (sessions[sessionId].participants.length >= sessions[sessionId].participantCount) {
      return res.status(400).json({ error: 'Participant limit reached' });
    }

    if (sessions[sessionId].participants.includes(participantAddress)) {
      return res.status(400).json({ error: 'Participant already added' });
    }

    sessions[sessionId].participants.push(participantAddress);

    res.json({ message: 'Participant added', participants: sessions[sessionId].participants });
  } catch (err) {
    console.error('Join session error:', err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

router.post('/:sessionId/finalize', (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    sessions[sessionId].finalized = true;

    res.json({ message: 'Session finalized', session: sessions[sessionId] });
  } catch (err) {
    console.error('Finalize error:', err);
    res.status(500).json({ error: 'Failed to finalize session' });
  }
});

router.get('/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;

  if (!sessions[sessionId]) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(sessions[sessionId]);
});

module.exports = router;

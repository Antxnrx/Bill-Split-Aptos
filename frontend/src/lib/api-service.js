// API service for communicating with the backend
const API_BASE_URL = '/api';

export class ApiService {
  static async createSession(sessionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  static async joinSession(sessionId, participantAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantAddress }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  static async finalizeSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${sessionId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error finalizing session:', error);
      throw error;
    }
  }

  static async getSessionStatus(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${sessionId}/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
}

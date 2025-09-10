"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, X, ArrowLeft, Filter, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatAmount, formatAddress } from '@/lib/utils';
import { BillSession, BillStatus } from '@/types';

export default function HistoryPage() {
  const router = useRouter();
  const { wallet, sessions } = useApp();
  const [selectedSession, setSelectedSession] = useState<BillSession | null>(null);
  const [filterStatus, setFilterStatus] = useState<BillStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesSearch = session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.session_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSelectSession = (session: BillSession) => {
    setSelectedSession(session);
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Created';
      case 1: return 'Participants Added';
      case 2: return 'Approved';
      case 3: return 'Settled';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-blue-600 bg-blue-50';
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-green-600 bg-green-50';
      case 3: return 'text-gray-600 bg-gray-50';
      case 4: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 3: return <CheckCircle className="h-4 w-4" />;
      case 4: return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSessionStats = () => {
    const total = sessions.length;
    const settled = sessions.filter(s => s.status === 3).length;
    const active = sessions.filter(s => s.status < 3).length;
    const cancelled = sessions.filter(s => s.status === 4).length;
    
    return { total, settled, active, cancelled };
  };

  const stats = getSessionStats();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">History</h1>
        </div>

        {!selectedSession ? (
          /* Session List */
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Bills</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.settled}</p>
                    <p className="text-sm text-gray-600">Settled</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: BillStatus.CREATED, label: 'Created' },
                      { value: BillStatus.PARTICIPANTS_ADDED, label: 'Participants Added' },
                      { value: BillStatus.APPROVED, label: 'Approved' },
                      { value: BillStatus.SETTLED, label: 'Settled' },
                      { value: BillStatus.CANCELLED, label: 'Cancelled' },
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        variant={filterStatus === filter.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus(filter.value as any)}
                      >
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions List */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Sessions</CardTitle>
                <CardDescription>
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No bill sessions found</p>
                    <Button onClick={() => router.push('/create')}>
                      Create New Bill
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map((session) => {
                      const userParticipant = session.participants.find(p => p.address === wallet?.address);
                      const isMerchant = session.merchant_address === wallet?.address;
                      
                      return (
                        <div
                          key={session.session_id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSelectSession(session)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{session.description}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                  {getStatusIcon(session.status)}
                                  <span className="ml-1">{getStatusText(session.status)}</span>
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                {session.participants.length} participants • {formatAmount(session.total_amount)}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                ID: {session.session_id}
                              </p>
                              {userParticipant && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Your role: {isMerchant ? 'Merchant' : 'Participant'} • 
                                  Amount: {formatAmount(userParticipant.amount_owed)}
                                  {userParticipant.has_paid && ' (Paid ✓)'}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {new Date(session.created_at).toLocaleDateString()}
                              </p>
                              {session.status === 3 && (
                                <p className="text-xs text-green-600 mt-1">
                                  Settled {new Date(session.settled_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Session Details */
          <div className="space-y-4">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedSession.description}</CardTitle>
                    <CardDescription>
                      Session ID: {selectedSession.session_id}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(null)}
                  >
                    Back to History
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">{formatAmount(selectedSession.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${getStatusColor(selectedSession.status)}`}>
                      {getStatusText(selectedSession.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {new Date(selectedSession.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Merchant</p>
                    <p className="font-medium font-mono text-xs">
                      {formatAddress(selectedSession.merchant_address)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>All participants and their payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedSession.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {participant.has_paid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {formatAddress(participant.address)}
                          </p>
                          {participant.has_paid && participant.payment_timestamp > 0 && (
                            <p className="text-xs text-green-600">
                              Paid on {new Date(participant.payment_timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(participant.amount_owed)}</p>
                        <p className="text-xs text-gray-500">
                          {participant.has_paid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Session activity timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="font-medium">Session Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedSession.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {selectedSession.status >= 1 && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Participants Added</p>
                        <p className="text-sm text-gray-500">
                          {selectedSession.participants.length} participants added
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedSession.status >= 2 && selectedSession.approved_at > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Bill Approved</p>
                        <p className="text-sm text-gray-500">
                          {selectedSession.current_signatures}/{selectedSession.required_signatures} signatures collected
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedSession.approved_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedSession.status === 3 && selectedSession.settled_at > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Bill Settled</p>
                        <p className="text-sm text-gray-500">
                          All payments received and processed
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedSession.settled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

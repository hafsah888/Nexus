import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar-theme.css';
import { CalendarDays, Plus, Trash2, Clock, Pencil, X, Send, Check, XCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUsersByRole, findUserById } from '../../data/users';

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface MeetingRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'accepted' | 'declined';
}

const REQUESTS_STORAGE_KEY = 'nexus_meeting_requests';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'requests'>('calendar');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [requests, setRequests] = useState<MeetingRequest[]>([]);
  const [recipientId, setRecipientId] = useState<string>('');
  const [reqStartTime, setReqStartTime] = useState('09:00');
  const [reqEndTime, setReqEndTime] = useState('10:00');

  const dateKey = (date: Date) => date.toISOString().split('T')[0];
  const selectedKey = dateKey(selectedDate);
  const slotsForSelectedDate = slots.filter((slot) => slot.date === selectedKey);

  useEffect(() => {
    const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (stored) {
      setRequests(JSON.parse(stored));
    } else {
      // Seed demo data so Accept/Decline buttons are visible immediately on first load
      const seedRequests: MeetingRequest[] = [
        {
          id: 'seed-1',
          fromUserId: 'i1',
          fromName: 'Michael Rodriguez',
          toUserId: 'e1',
          toName: 'Sarah Johnson',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '10:30',
          status: 'pending',
        },
        {
          id: 'seed-2',
          fromUserId: 'e1',
          fromName: 'Sarah Johnson',
          toUserId: 'i1',
          toName: 'Michael Rodriguez',
          date: new Date().toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '14:30',
          status: 'pending',
        },
      ];
      setRequests(seedRequests);
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(seedRequests));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  if (!user) return null;

  const otherRole = user.role === 'entrepreneur' ? 'investor' : 'entrepreneur';
  const otherUsers = getUsersByRole(otherRole);

  const incomingRequests = requests.filter((r) => r.toUserId === user.id);
  const sentRequests = requests.filter((r) => r.fromUserId === user.id);
  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  const resetSlotForm = () => {
    setStartTime('09:00');
    setEndTime('10:00');
    setEditingId(null);
  };

  const handleAddOrUpdateSlot = () => {
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }
    if (editingId) {
      setSlots((prev) => prev.map((s) => (s.id === editingId ? { ...s, startTime, endTime } : s)));
    } else {
      setSlots((prev) => [...prev, { id: Date.now().toString(), date: selectedKey, startTime, endTime }]);
    }
    resetSlotForm();
  };

  const handleRemoveSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) resetSlotForm();
  };

  const handleEditClick = (slot: AvailabilitySlot) => {
    setEditingId(slot.id);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
  };

  const handleSendRequest = () => {
    if (!recipientId) {
      alert('Please select a person to send the request to');
      return;
    }
    if (reqStartTime >= reqEndTime) {
      alert('End time must be after start time');
      return;
    }
    const recipient = otherUsers.find((u) => u.id === recipientId);
    if (!recipient) return;

    const newRequest: MeetingRequest = {
      id: Date.now().toString(),
      fromUserId: user.id,
      fromName: user.name,
      toUserId: recipient.id,
      toName: recipient.name,
      date: selectedKey,
      startTime: reqStartTime,
      endTime: reqEndTime,
      status: 'pending',
    };
    setRequests((prev) => [...prev, newRequest]);
    setRecipientId('');
  };

  const handleAccept = (id: string) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r)));
  const handleDecline = (id: string) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'declined' } : r)));

  const statusBadge = (status: MeetingRequest['status']) => {
    const styles = {
      pending: 'bg-warning-50 text-warning-700',
      accepted: 'bg-success-50 text-success-700',
      declined: 'bg-error-50 text-error-700',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const Avatar = ({ userId, name }: { userId: string; name: string }) => {
    const person = findUserById(userId);
    if (person?.avatarUrl) {
      return <img src={person.avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />;
    }
    return (
      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
        {name.charAt(0)}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <CalendarDays className="text-primary-600 mr-2" size={24} />
        <h1 className="text-xl font-semibold text-gray-900">Meeting Scheduler</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 max-w-3xl">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'calendar'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Calendar & Availability
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Meeting Requests
          {pendingIncomingCount > 0 && (
            <span className="bg-error-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {pendingIncomingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-3xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <Calendar
                onChange={(value) => {
                  setSelectedDate(value as Date);
                  resetSlotForm();
                }}
                value={selectedDate}
              />
              <p className="mt-4 text-sm text-gray-600">
                Selected date: <span className="font-medium text-gray-900">{selectedDate.toDateString()}</span>
              </p>
            </div>

            <div className="md:w-1/2 md:border-l md:pl-6 border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Clock size={16} className="mr-2 text-primary-600" />
                Availability for this date
              </h2>

              {editingId && (
                <div className="flex items-center justify-between bg-accent-50 border border-accent-200 rounded-md px-3 py-1.5 mb-2">
                  <span className="text-xs text-accent-700 font-medium">Editing slot...</span>
                  <button onClick={resetSlotForm} className="text-accent-700 hover:text-accent-900">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm w-full"
                />
                <button
                  onClick={handleAddOrUpdateSlot}
                  className="bg-primary-600 text-white rounded-md p-2 hover:bg-primary-700 shrink-0"
                  title={editingId ? 'Update slot' : 'Add slot'}
                >
                  <Plus size={16} />
                </button>
              </div>

              {slotsForSelectedDate.length === 0 ? (
                <p className="text-sm text-gray-500">No availability added for this date yet.</p>
              ) : (
                <div className="space-y-2">
                  {slotsForSelectedDate.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between border rounded-md px-3 py-2 ${
                        editingId === slot.id ? 'bg-accent-50 border-accent-300' : 'bg-primary-50 border-primary-100'
                      }`}
                    >
                      <span className="text-sm text-primary-700 font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(slot)} className="text-gray-400 hover:text-primary-600">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleRemoveSlot(slot.id)} className="text-gray-400 hover:text-error-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-3xl">
          {/* Send request */}
          <div className="pb-5 mb-5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Send size={16} className="mr-2 text-primary-600" />
              Send Meeting Request
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm flex-1 min-w-[180px]"
              >
                <option value="">Select {otherRole}...</option>
                {otherUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={reqStartTime}
                onChange={(e) => setReqStartTime(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="time"
                value={reqEndTime}
                onChange={(e) => setReqEndTime(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
              />
              <button
                onClick={handleSendRequest}
                className="bg-primary-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-primary-700 flex items-center gap-1"
              >
                <Send size={14} /> Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              For {selectedDate.toDateString()} (change date from the Calendar tab).
            </p>
          </div>

          {/* Incoming */}
          <div className="pb-5 mb-5 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Users size={16} className="mr-2 text-primary-600" />
              Incoming Requests
            </h2>
            {incomingRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No incoming requests.</p>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <Avatar userId={r.fromUserId} name={r.fromName} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{r.fromName}</span>
                          {statusBadge(r.status)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {r.date} • {r.startTime} - {r.endTime}
                        </p>
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleAccept(r.id)}
                          className="flex items-center gap-1 bg-success-50 text-success-700 text-xs font-medium px-3 py-1 rounded-md hover:bg-success-100"
                        >
                          <Check size={14} /> Accept
                        </button>
                        <button
                          onClick={() => handleDecline(r.id)}
                          className="flex items-center gap-1 bg-error-50 text-error-700 text-xs font-medium px-3 py-1 rounded-md hover:bg-error-100"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Sent Requests</h2>
            {sentRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No requests sent yet.</p>
            ) : (
              <div className="space-y-2">
                {sentRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <Avatar userId={r.toUserId} name={r.toName} />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{r.toName}</span>
                        <p className="text-xs text-gray-600">
                          {r.date} • {r.startTime} - {r.endTime}
                        </p>
                      </div>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
// In-app chat with anti-leakage filtering
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { messagesService, listingsService } from './SERVICES_supabaseService';
import { formatDateIST } from './LIB_utils';
import { LEAKAGE_PATTERNS } from './CONFIG_constants';
import { Send, AlertTriangle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_REPLIES = [
  'Is this still available?',
  "What's your lowest price?",
  'Can you ship today?',
];

export default function PAGES_Chat() {
  const { listing_id, order_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [listing, setListing] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => { loadChat(); }, [listing_id, order_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // BUG FIX: subscribe to real-time messages so chat updates without page refresh.
  // Unsubscribe on unmount to avoid listener leaks.
  useEffect(() => {
    if (!listing_id) return;
    const subscription = messagesService.subscribeToMessages(listing_id, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    });
    return () => subscription.unsubscribe();
  }, [listing_id]);

  const loadChat = async () => {
    try {
      setLoading(true);
      if (listing_id) {
        const data = await listingsService.getListingById(listing_id);
        setListing(data);
        setOtherUser(data.users);
      }
      const messagesData = listing_id
        ? await messagesService.getListingMessages(listing_id)
        : await messagesService.getOrderMessages(order_id);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  // BUG FIX: regex with /g flag is stateful — lastIndex must be reset before each test.
  // Previously checkForLeakage would silently miss matches every other call.
  const checkForLeakage = (text) => {
    LEAKAGE_PATTERNS.phone.lastIndex = 0;
    LEAKAGE_PATTERNS.upi.lastIndex = 0;
    LEAKAGE_PATTERNS.platforms.lastIndex = 0;
    LEAKAGE_PATTERNS.email.lastIndex = 0;
    return (
      LEAKAGE_PATTERNS.phone.test(text) ||
      LEAKAGE_PATTERNS.upi.test(text) ||
      LEAKAGE_PATTERNS.platforms.test(text) ||
      LEAKAGE_PATTERNS.email.test(text)
    );
  };

  const buildMessage = (flagged = false) => ({
    listing_id: listing_id || null,
    order_id: order_id || null,
    sender_id: user.id,
    receiver_id: otherUser?.id,
    content: messageText,
    is_flagged: flagged,
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) { toast.error('Message cannot be empty'); return; }

    if (checkForLeakage(messageText)) {
      setShowWarning(true);
      return;
    }
    await doSend(false);
  };

  const doSend = async (flagged) => {
    try {
      setSending(true);
      await messagesService.sendMessage(buildMessage(flagged));
      // Optimistic update
      setMessages(prev => [...prev, {
        ...buildMessage(flagged),
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
        users: user,
      }]);
      setMessageText('');
      setShowWarning(false);
      if (flagged) toast('Message sent, but flagged for sharing contact info.', { icon: '⚠️' });
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-white border-b border-gray-200 p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft size={20} />Back
        </button>
        <h1 className="text-xl font-bold">{otherUser?.name || 'Chat'}</h1>
        {listing && <p className="text-sm text-gray-600">{listing.title}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id || msg.created_at}
              className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender_id === user.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
              }`}>
                <p>{msg.content}</p>
                {msg.is_flagged && (
                  <p className="text-xs mt-1 opacity-70">⚠️ Contains sensitive info</p>
                )}
                <p className="text-xs mt-1 opacity-70">{formatDateIST(msg.created_at)}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 font-semibold mb-2">Quick replies:</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_REPLIES.map(reply => (
            <button
              key={reply}
              onClick={() => setMessageText(reply)}
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Leakage Warning */}
      {showWarning && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="flex gap-3 items-start mb-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">
                Your message contains contact info. Sharing removes buyer protection. Continue?
              </p>
              <p className="text-xs text-gray-600 mt-1">Keep chats on Knott to stay protected against fraud.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 bg-white border border-red-300 text-red-600 px-4 py-2 rounded font-semibold hover:bg-red-50"
            >
              Cancel
            </button>
            <button
              onClick={() => doSend(true)}
              disabled={sending}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Send Anyway
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

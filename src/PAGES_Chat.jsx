// In-app chat with anti-leakage filtering
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from './STORE_useAuthStore';
import { messagesService, listingsService } from './SERVICES_supabaseService';
import { formatDateIST } from './LIB_utils';
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
  const [warningMessage, setWarningMessage] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Anti-leakage patterns
  const LEAKAGE_PATTERNS = [
    /[6-9]\d{9}/g, // Indian mobile numbers
    /[\w.]+@(okicici|paytm|ybl|upi)/gi, // UPI IDs
    /whatsapp|telegram|instagram|snapchat|facebook|twitter/gi, // Platform mentions
    /[\w.+-]+@[\w-]+\.[a-z]{2,}/gi, // Emails
  ];

  useEffect(() => {
    loadChat();
  }, [listing_id, order_id]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      setLoading(true);

      if (listing_id) {
        const data = await listingsService.getListingById(listing_id);
        setListing(data);
        // Set other user as seller
        setOtherUser(data.users);
      }

      // Load messages
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

  const checkForLeakage = (text) => {
    for (let pattern of LEAKAGE_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    // Check for leakage
    if (checkForLeakage(messageText)) {
      setShowWarning(true);
      setWarningMessage(
        'Your message contains contact info. Sharing removes buyer protection. Continue?'
      );
      return;
    }

    try {
      setSending(true);

      const message = {
        listing_id: listing_id || null,
        order_id: order_id || null,
        sender_id: user.id,
        receiver_id: otherUser.id,
        content: messageText,
        is_flagged: false,
      };

      await messagesService.sendMessage(message);

      // Add to local state optimistically
      setMessages(prev => [...prev, {
        ...message,
        created_at: new Date().toISOString(),
        users: user,
      }]);

      setMessageText('');
      setShowWarning(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = async (reply) => {
    setMessageText(reply);
  };

  const confirmWarningAndSend = async () => {
    try {
      setSending(true);

      const message = {
        listing_id: listing_id || null,
        order_id: order_id || null,
        sender_id: user.id,
        receiver_id: otherUser.id,
        content: messageText,
        is_flagged: true, // Mark as flagged due to leakage
      };

      await messagesService.sendMessage(message);

      setMessages(prev => [...prev, {
        ...message,
        created_at: new Date().toISOString(),
        users: user,
      }]);

      setMessageText('');
      setShowWarning(false);
      toast.warning('Your message was sent but flagged. Repeated violations will suspend your account.');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-xl font-bold">{otherUser?.name}</h1>
        {listing && (
          <p className="text-sm text-gray-600">{listing.title}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_id === user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p>{msg.content}</p>
                {msg.is_flagged && (
                  <p className="text-xs mt-1 opacity-70">
                    ⚠️ Message contains sensitive info
                  </p>
                )}
                <p className="text-xs mt-1 opacity-70">
                  {formatDateIST(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
        <p className="text-xs text-gray-600 font-semibold">Quick replies:</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_REPLIES.map(reply => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-100 transition"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Warning */}
      {showWarning && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="flex gap-3 items-start mb-3">
            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">{warningMessage}</p>
              <p className="text-xs text-gray-600 mt-1">
                Keep chats on SwapSafe to stay protected against fraud.
              </p>
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
              onClick={confirmWarningAndSend}
              disabled={sending}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Send Anyway
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 flex gap-2"
      >
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

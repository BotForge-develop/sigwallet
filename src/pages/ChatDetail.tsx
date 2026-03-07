import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Banknote } from 'lucide-react';
import NumPad from '@/components/NumPad';
import TransferModal from '@/components/TransferModal';
import { contacts, mockChats, currentUser, type ChatMessage } from '@/lib/mockData';

const ChatDetail = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const contact = contacts.find((c) => c.id === contactId);
  const [messages, setMessages] = useState<ChatMessage[]>(mockChats[contactId || ''] || []);
  const [input, setInput] = useState('');
  const [showNumPad, setShowNumPad] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!contact) return null;

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: currentUser.id,
      text: input,
      timestamp: new Date().toISOString(),
      type: 'text',
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  const handleSendMoney = () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0) return;
    setShowModal(true);
  };

  const handleTransferSuccess = () => {
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: currentUser.id,
      amount: parseFloat(sendAmount),
      timestamp: new Date().toISOString(),
      type: 'transfer',
    };
    setMessages((prev) => [...prev, msg]);
    setSendAmount('');
    setShowNumPad(false);
  };

  return (
    <motion.div
      className="flex flex-col h-screen"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 glass">
        <button onClick={() => navigate('/chat')}>
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full gradient-beige flex items-center justify-center text-xs font-semibold text-primary-foreground">
          {contact.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{contact.name}</p>
          <p className="text-[10px] text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          if (msg.type === 'transfer') {
            return (
              <motion.div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="glass-strong rounded-2xl px-5 py-3 text-center max-w-[200px]">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isMe ? 'You sent' : `${contact.name} sent`}
                  </p>
                  <p className="text-2xl font-bold text-beige">{msg.amount?.toFixed(2)} €</p>
                  <p className="text-[10px] text-success mt-1">✓ Completed</p>
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? 'gradient-beige text-primary-foreground rounded-br-md'
                    : 'glass text-foreground rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input / NumPad */}
      <AnimatePresence mode="wait">
        {showNumPad ? (
          <motion.div
            key="numpad"
            className="px-5 pb-8 pt-4 glass"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <button
              onClick={() => setShowNumPad(false)}
              className="text-xs text-muted-foreground mb-3"
            >
              ← Back to chat
            </button>
            <NumPad value={sendAmount} onChange={setSendAmount} onSend={handleSendMoney} />
          </motion.div>
        ) : (
          <motion.div
            key="input"
            className="flex items-center gap-2 px-5 pb-8 pt-3 glass"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            <button
              onClick={() => setShowNumPad(true)}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0"
            >
              <Banknote size={18} className="text-beige" />
            </button>
            <div className="flex-1 flex items-center gap-2 glass rounded-2xl px-4 h-10">
              <input
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>
                <Send size={16} className="text-beige" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransferModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        amount={parseFloat(sendAmount) || 0}
        recipientName={contact.name}
        onSuccess={handleTransferSuccess}
      />
    </motion.div>
  );
};

export default ChatDetail;

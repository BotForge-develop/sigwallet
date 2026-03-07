import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ContactAvatar from '@/components/ContactAvatar';
import { useContacts, type DbContact } from '@/hooks/useContacts';

const Chat = () => {
  const navigate = useNavigate();
  const { contacts, loading } = useContacts();

  const handleSelect = (contact: DbContact) => {
    navigate(`/chat/${contact.id}`);
  };

  return (
    <motion.div
      className="min-h-screen pb-24 px-5 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-xl font-semibold text-foreground mb-6">Messages</h1>

      {/* Horizontal contact scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-6 -mx-5 px-5 scrollbar-none">
        {contacts.map((c, i) => (
          <ContactAvatar key={c.id} contact={c} index={i} onSelect={() => handleSelect(c)} size="sm" />
        ))}
      </div>

      {/* Chat list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-8">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">No contacts yet. Add contacts to start chatting.</div>
        ) : (
          contacts.map((contact, i) => (
            <motion.button
              key={contact.id}
              className="w-full flex items-center gap-3 p-3 rounded-2xl glass text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(contact)}
            >
              <div className="w-11 h-11 rounded-full gradient-beige flex items-center justify-center text-sm font-semibold text-primary-foreground flex-shrink-0">
                {contact.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{contact.name}</p>
                <p className="text-xs text-muted-foreground truncate">Start a conversation</p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default Chat;

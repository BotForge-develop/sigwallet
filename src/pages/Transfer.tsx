import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ContactAvatar from '@/components/ContactAvatar';
import NumPad from '@/components/NumPad';
import TransferModal from '@/components/TransferModal';
import { contacts, type Contact } from '@/lib/mockData';
import { ArrowLeft } from 'lucide-react';

const Transfer = () => {
  const navigate = useNavigate();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleSend = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setShowModal(true);
  };

  return (
    <motion.div
      className="min-h-screen pb-24 px-5 pt-14"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {selectedContact && (
          <button onClick={() => setSelectedContact(null)}>
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-foreground">
          {selectedContact ? `Send to ${selectedContact.name}` : 'Send Money'}
        </h1>
      </div>

      {!selectedContact ? (
        <>
          {/* Contacts grid */}
          <p className="text-sm text-muted-foreground mb-4">Choose a contact</p>
          <div className="grid grid-cols-4 gap-4">
            {contacts.map((c, i) => (
              <ContactAvatar key={c.id} contact={c} index={i} onSelect={setSelectedContact} />
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <NumPad value={amount} onChange={setAmount} onSend={handleSend} />
        </motion.div>
      )}

      <TransferModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setAmount(''); setSelectedContact(null); }}
        amount={parseFloat(amount) || 0}
        recipientName={selectedContact?.name || ''}
        onSuccess={() => {}}
      />
    </motion.div>
  );
};

export default Transfer;

import { useState } from 'react';
import { motion } from 'framer-motion';
import ContactAvatar from '@/components/ContactAvatar';
import NumPad from '@/components/NumPad';
import TransferModal from '@/components/TransferModal';
import { useContacts, type DbContact } from '@/hooks/useContacts';
import { useTransactions } from '@/hooks/useTransactions';
import { ArrowLeft, User, Building2 } from 'lucide-react';

const Transfer = () => {
  const { contacts, loading } = useContacts();
  const { transactions } = useTransactions();
  const [selectedContact, setSelectedContact] = useState<DbContact | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientIban, setRecipientIban] = useState('');
  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Unique counterparts from real transactions for quick pick
  const recentRecipients = transactions
    .filter(t => t.counterpart_name && t.counterpart_iban && t.amount < 0)
    .reduce<Array<{ name: string; iban: string }>>((acc, t) => {
      if (!acc.find(r => r.iban === t.counterpart_iban)) {
        acc.push({ name: t.counterpart_name!, iban: t.counterpart_iban! });
      }
      return acc;
    }, [])
    .slice(0, 6);

  const handleSend = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setShowModal(true);
  };

  const selectRecipient = (name: string, iban: string) => {
    setRecipientName(name);
    setRecipientIban(iban);
    setManualMode(true);
  };

  return (
    <motion.div
      className="min-h-screen pb-24 px-4 pt-12 overflow-y-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        {(selectedContact || manualMode) && (
          <button onClick={() => { setSelectedContact(null); setManualMode(false); setRecipientName(''); setRecipientIban(''); }}>
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        )}
        <h1 className="text-base font-semibold text-foreground">
          {selectedContact ? `An ${selectedContact.name}` : manualMode ? `An ${recipientName || 'IBAN'}` : 'Geld senden'}
        </h1>
      </div>

      {!selectedContact && !manualMode ? (
        <>
          {/* Manual IBAN Entry */}
          <motion.button
            className="w-full glass rounded-xl p-3 flex items-center gap-3 mb-4"
            whileTap={{ scale: 0.98 }}
            onClick={() => setManualMode(true)}
          >
            <div className="w-9 h-9 rounded-full glass flex items-center justify-center">
              <Building2 size={16} className="text-beige" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">An IBAN senden</p>
              <p className="text-[10px] text-muted-foreground">Banküberweisung per IBAN</p>
            </div>
          </motion.button>

          {/* Recent Recipients */}
          {recentRecipients.length > 0 && (
            <>
              <p className="text-[10px] text-muted-foreground mb-2">Letzte Empfänger</p>
              <div className="glass rounded-xl divide-y divide-border mb-4">
                {recentRecipients.map((r) => (
                  <motion.button
                    key={r.iban}
                    className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectRecipient(r.name, r.iban)}
                  >
                    <div className="w-7 h-7 rounded-full glass flex items-center justify-center shrink-0">
                      <User size={12} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{r.name}</p>
                      <p className="text-[9px] text-muted-foreground font-mono truncate">{r.iban}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {/* Contacts */}
          <p className="text-[10px] text-muted-foreground mb-2">Kontakte</p>
          {loading ? (
            <div className="text-center text-muted-foreground text-xs py-4">Laden...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-4">Keine Kontakte</div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {contacts.map((c, i) => (
                <ContactAvatar
                  key={c.id}
                  contact={c}
                  index={i}
                  onSelect={() => setSelectedContact(c)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2"
        >
          {/* IBAN fields or selected recipient */}
          {manualMode && !recipientIban && (
            <div className="space-y-3 mb-6">
              <div className="glass rounded-xl px-3 py-2.5">
                <label className="text-[9px] text-muted-foreground">Empfänger Name</label>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Max Mustermann" className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full mt-0.5" />
              </div>
              <div className="glass rounded-xl px-3 py-2.5">
                <label className="text-[9px] text-muted-foreground">IBAN</label>
                <input type="text" value={recipientIban} onChange={(e) => setRecipientIban(e.target.value.toUpperCase())} placeholder="DE89 3704 0044 0532 0130 00" className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full mt-0.5 font-mono" />
              </div>
            </div>
          )}
          {recipientIban && (
            <div className="glass rounded-xl px-3 py-2 mb-4">
              <p className="text-[10px] text-muted-foreground">Empfänger</p>
              <p className="text-xs font-medium text-foreground">{recipientName}</p>
              <p className="text-[9px] text-muted-foreground font-mono">{recipientIban}</p>
            </div>
          )}
          <NumPad value={amount} onChange={setAmount} onSend={handleSend} />
        </motion.div>
      )}

      <TransferModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setAmount(''); setSelectedContact(null); setManualMode(false); setRecipientName(''); setRecipientIban(''); }}
        amount={parseFloat(amount) || 0}
        recipientName={selectedContact?.name || recipientName || 'Empfänger'}
        onSuccess={() => {}}
      />
    </motion.div>
  );
};

export default Transfer;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Link, Palette, Shield, ChevronRight, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useContacts } from '@/hooks/useContacts';
import { toast } from 'sonner';

const Profile = () => {
  const { signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { contacts, addContact } = useContacts();
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIban, setNewIban] = useState('');

  const handleAddContact = async () => {
    if (!newName.trim()) return;
    const initials = newName.trim().slice(0, 2).toUpperCase();
    const { error } = await addContact({ name: newName.trim(), initials, iban: newIban || undefined }) || {};
    if (error) { toast.error(error.message); return; }
    toast.success(`${newName} added!`);
    setNewName('');
    setNewIban('');
    setShowAddContact(false);
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', subtitle: profile?.display_name || 'Set your name' },
        { icon: Link, label: 'API Endpoint', subtitle: profile?.api_endpoint_url || 'Not configured' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Appearance', subtitle: 'Dark mode' },
        { icon: Shield, label: 'Security', subtitle: '2FA, biometrics' },
      ],
    },
  ];

  return (
    <motion.div
      className="min-h-screen pb-24 px-5 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Profile header */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-20 h-20 rounded-full gradient-beige flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">
          {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h1 className="text-xl font-semibold text-foreground">{profile?.display_name || 'User'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{profile?.custom_iban || 'No IBAN set'}</p>
      </motion.div>

      {/* Contacts section */}
      <motion.div
        className="mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Contacts ({contacts.length})</p>
          <button onClick={() => setShowAddContact(!showAddContact)} className="text-beige">
            <Plus size={16} />
          </button>
        </div>

        {showAddContact && (
          <motion.div
            className="glass rounded-2xl p-4 mb-3 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <input
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none glass rounded-xl px-4 h-10"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none glass rounded-xl px-4 h-10"
              placeholder="IBAN (optional)"
              value={newIban}
              onChange={(e) => setNewIban(e.target.value)}
            />
            <motion.button
              className="w-full h-10 rounded-xl gradient-beige text-primary-foreground font-semibold text-sm"
              whileTap={{ scale: 0.97 }}
              onClick={handleAddContact}
            >
              Add Contact
            </motion.button>
          </motion.div>
        )}

        <div className="glass rounded-2xl divide-y divide-border">
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No contacts yet</div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full gradient-beige flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  {c.iban && <p className="text-xs text-muted-foreground">{c.iban}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Settings */}
      {settingsGroups.map((group, gi) => (
        <motion.div
          key={group.title}
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 + gi * 0.1 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">
            {group.title}
          </p>
          <div className="glass rounded-2xl divide-y divide-border">
            {group.items.map((item) => (
              <button key={item.label} className="w-full flex items-center gap-3 p-4 text-left">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
                  <item.icon size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Logout */}
      <motion.button
        className="w-full flex items-center justify-center gap-2 glass rounded-2xl p-4 text-destructive"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.98 }}
        onClick={signOut}
      >
        <LogOut size={16} />
        <span className="text-sm font-medium">Sign Out</span>
      </motion.button>
    </motion.div>
  );
};

export default Profile;

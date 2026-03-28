import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Link, Palette, Shield, ChevronRight, LogOut, Plus, Check, X, ScanFace } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useContacts } from '@/hooks/useContacts';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import {
  deleteCredentials,
  isBiometricAvailable,
  isBiometricEnabled,
  saveCredentials,
} from '@/lib/biometrics';

const Profile = () => {
  const { signOut, user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { contacts, addContact } = useContacts();
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIban, setNewIban] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState('');
  const [biometricSaving, setBiometricSaving] = useState(false);
  const biometricSupported = useMemo(() => Capacitor.getPlatform() === 'ios', []);
  const biometricActive = biometricSupported && isBiometricEnabled();

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const saveEdit = async () => {
    if (!editingField) return;
    const key = editingField === 'Edit Profile' ? 'display_name'
      : editingField === 'API Endpoint' ? 'api_endpoint_url'
      : editingField === 'IBAN' ? 'custom_iban' : null;
    if (!key) return;
    const res = await updateProfile({ [key]: editValue.trim() || null });
    if (res?.error) toast.error(res.error.message);
    else toast.success('Gespeichert!');
    setEditingField(null);
  };

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

  const handleOpenBiometricSetup = async () => {
    const available = await isBiometricAvailable();
    if (!available) {
      toast.error('Face ID ist auf diesem Gerät aktuell nicht verfügbar.');
      return;
    }
    setShowBiometricSetup(true);
  };

  const handleEnableBiometric = async () => {
    if (!user?.email) {
      toast.error('Keine E-Mail für diesen Account gefunden.');
      return;
    }

    if (!biometricPassword.trim()) {
      toast.error('Bitte gib dein Passwort ein.');
      return;
    }

    setBiometricSaving(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: biometricPassword,
      });

      if (error) throw error;

      await saveCredentials(user.email, biometricPassword);
      setShowBiometricSetup(false);
      setBiometricPassword('');
      toast.success('Face ID ist jetzt aktiviert.');
    } catch (error: any) {
      toast.error(error.message || 'Face ID konnte nicht aktiviert werden.');
    } finally {
      setBiometricSaving(false);
    }
  };

  const handleDisableBiometric = async () => {
    await deleteCredentials();
    setShowBiometricSetup(false);
    setBiometricPassword('');
    toast.success('Face ID wurde deaktiviert.');
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', subtitle: profile?.display_name || 'Set your name', editable: true, value: profile?.display_name || '' },
        { icon: Link, label: 'IBAN', subtitle: profile?.custom_iban || 'Set your IBAN', editable: true, value: profile?.custom_iban || '' },
        { icon: Link, label: 'API Endpoint', subtitle: profile?.api_endpoint_url || 'Not configured', editable: true, value: profile?.api_endpoint_url || '' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Appearance', subtitle: 'Dark mode', editable: false, value: '' },
        { icon: Shield, label: 'Security', subtitle: '2FA, biometrics', editable: false, value: '' },
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

      {biometricSupported && (
        <motion.div
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Security
          </p>
          <div className="glass rounded-2xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 p-4 text-left"
              onClick={biometricActive ? handleDisableBiometric : handleOpenBiometricSetup}
            >
              <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
                <ScanFace size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Face ID</p>
                <p className="text-xs text-muted-foreground">
                  {biometricActive ? 'Aktiviert für schnellen Login' : 'Aktiviere Login ohne Passwort-Eingabe'}
                </p>
              </div>
              <span className="text-xs font-medium text-beige">
                {biometricActive ? 'An' : 'Aus'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {showBiometricSetup && !biometricActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Gib einmal dein Passwort ein, damit Face ID sicher für diesen Account gespeichert wird.
                    </p>
                    <input
                      type="password"
                      className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none glass rounded-xl px-4 h-11"
                      placeholder="Passwort bestätigen"
                      value={biometricPassword}
                      onChange={(e) => setBiometricPassword(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 h-11 rounded-xl gradient-beige text-primary-foreground font-semibold text-sm"
                        onClick={handleEnableBiometric}
                        disabled={biometricSaving}
                      >
                        {biometricSaving ? 'Aktiviere…' : 'Face ID aktivieren'}
                      </button>
                      <button
                        type="button"
                        className="h-11 px-4 rounded-xl glass text-sm text-foreground"
                        onClick={() => {
                          setShowBiometricSetup(false);
                          setBiometricPassword('');
                        }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

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
              <div key={item.label}>
                {editingField === item.label ? (
                  <motion.div
                    className="flex items-center gap-3 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
                      <item.icon size={16} className="text-muted-foreground" />
                    </div>
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-beige pb-1"
                      placeholder={item.label === 'Edit Profile' ? 'Display Name' : item.label}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <button onClick={saveEdit} className="text-beige"><Check size={16} /></button>
                    <button onClick={() => setEditingField(null)} className="text-muted-foreground"><X size={16} /></button>
                  </motion.div>
                ) : (
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => item.editable && startEdit(item.label, item.value)}
                  >
                    <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
                      <item.icon size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
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

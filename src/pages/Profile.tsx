import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Link, Shield, ChevronRight, LogOut, Plus, Check, X, ScanFace, Bell, Globe, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useContacts } from '@/hooks/useContacts';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import {
  deleteCredentials,
  isBiometricAvailable,
  isBiometricEnabled,
  promptBiometricEnrollment,
  saveCredentials,
} from '@/lib/biometrics';

const Profile = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
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
  const [darkMode] = useState(true);
  const [notifications] = useState(true);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const saveEdit = async () => {
    if (!editingField) return;
    const key = editingField === 'Name' ? 'display_name'
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
    toast.success(`${newName} hinzugefügt!`);
    setNewName('');
    setNewIban('');
    setShowAddContact(false);
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      const available = await isBiometricAvailable();
      if (!available) {
        toast.error('Face ID ist auf diesem Gerät nicht verfügbar.');
        return;
      }
      setShowBiometricSetup(true);
    } else {
      await deleteCredentials();
      setShowBiometricSetup(false);
      setBiometricPassword('');
      toast.success('Face ID deaktiviert.');
    }
  };

  const handleEnableBiometric = async () => {
    if (!user?.email || !biometricPassword.trim()) {
      toast.error('Bitte Passwort eingeben.');
      return;
    }

    setBiometricSaving(true);
    try {
      // Verify password first
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: biometricPassword,
      });
      if (error) throw error;

      // Prompt Face ID enrollment
      await promptBiometricEnrollment();

      // Save credentials for future biometric login
      await saveCredentials(user.email, biometricPassword);
      setShowBiometricSetup(false);
      setBiometricPassword('');
      toast.success('Face ID aktiviert!');
    } catch (error: any) {
      toast.error(error.message || 'Face ID konnte nicht aktiviert werden.');
    } finally {
      setBiometricSaving(false);
    }
  };

  const editableFields = [
    { key: 'Name', value: profile?.display_name || '', icon: User },
    { key: 'IBAN', value: profile?.custom_iban || '', icon: Link },
    { key: 'API Endpoint', value: profile?.api_endpoint_url || '', icon: Globe },
  ];

  return (
    <motion.div
      className="min-h-screen pb-24 px-4 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Profile Header - Compact */}
      <motion.div
        className="flex items-center gap-4 mb-6"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="w-14 h-14 rounded-2xl gradient-beige flex items-center justify-center text-xl font-bold text-primary-foreground">
          {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">{profile?.display_name || 'User'}</h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </motion.div>

      {/* Account Settings - Compact list */}
      <motion.div
        className="mb-4"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 px-1">Konto</p>
        <div className="glass rounded-2xl divide-y divide-border">
          {editableFields.map((field) => (
            <div key={field.key}>
              {editingField === field.key ? (
                <div className="flex items-center gap-2.5 p-3">
                  <field.icon size={14} className="text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-beige/50 pb-0.5"
                    placeholder={field.key}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                  <button onClick={saveEdit} className="text-beige"><Check size={14} /></button>
                  <button onClick={() => setEditingField(null)} className="text-muted-foreground"><X size={14} /></button>
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-2.5 p-3 text-left"
                  onClick={() => startEdit(field.key, field.value)}
                >
                  <field.icon size={14} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{field.key}</p>
                    <p className="text-sm text-foreground truncate">{field.value || '—'}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security & Preferences - Switches */}
      <motion.div
        className="mb-4"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 px-1">Einstellungen</p>
        <div className="glass rounded-2xl divide-y divide-border">
          {biometricSupported && (
            <div className="flex items-center gap-2.5 p-3">
              <ScanFace size={14} className="text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Face ID</p>
                <p className="text-[10px] text-muted-foreground">Schneller Login</p>
              </div>
              <Switch
                checked={biometricActive}
                onCheckedChange={handleToggleBiometric}
              />
            </div>
          )}
          <div className="flex items-center gap-2.5 p-3">
            <Bell size={14} className="text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">Push-Benachrichtigungen</p>
              <p className="text-[10px] text-muted-foreground">Transaktions-Alerts</p>
            </div>
            <Switch checked={notifications} disabled />
          </div>
          <div className="flex items-center gap-2.5 p-3">
            <Shield size={14} className="text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">Dark Mode</p>
              <p className="text-[10px] text-muted-foreground">Immer aktiv</p>
            </div>
            <Switch checked={darkMode} disabled />
          </div>
        </div>
      </motion.div>

      {/* Biometric Password Setup Drawer */}
      <AnimatePresence>
        {showBiometricSetup && !biometricActive && (
          <motion.div
            className="mb-4 glass rounded-2xl p-4 space-y-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <p className="text-xs text-muted-foreground">
              Gib dein Passwort ein um Face ID zu aktivieren.
            </p>
            <input
              type="password"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none glass rounded-xl px-3 h-10"
              placeholder="Passwort"
              value={biometricPassword}
              onChange={(e) => setBiometricPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnableBiometric()}
            />
            <div className="flex gap-2">
              <motion.button
                className="flex-1 h-10 rounded-xl gradient-beige text-primary-foreground font-semibold text-sm"
                whileTap={{ scale: 0.97 }}
                onClick={handleEnableBiometric}
                disabled={biometricSaving}
              >
                {biometricSaving ? 'Aktiviere…' : 'Aktivieren'}
              </motion.button>
              <button
                className="h-10 px-3 rounded-xl glass text-sm text-muted-foreground"
                onClick={() => { setShowBiometricSetup(false); setBiometricPassword(''); }}
              >
                Abbrechen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts - Compact */}
      <motion.div
        className="mb-4"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-1.5 px-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Kontakte ({contacts.length})</p>
          <button onClick={() => setShowAddContact(!showAddContact)} className="text-beige">
            <Plus size={14} />
          </button>
        </div>

        <AnimatePresence>
          {showAddContact && (
            <motion.div
              className="glass rounded-2xl p-3 mb-2 space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none glass rounded-xl px-3 h-9"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none glass rounded-xl px-3 h-9"
                placeholder="IBAN (optional)"
                value={newIban}
                onChange={(e) => setNewIban(e.target.value)}
              />
              <motion.button
                className="w-full h-9 rounded-xl gradient-beige text-primary-foreground font-semibold text-sm"
                whileTap={{ scale: 0.97 }}
                onClick={handleAddContact}
              >
                Hinzufügen
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass rounded-2xl divide-y divide-border">
          {contacts.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground text-xs">Noch keine Kontakte</div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 p-2.5">
                <div className="w-8 h-8 rounded-full gradient-beige flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0">
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  {c.iban && <p className="text-[10px] text-muted-foreground truncate">{c.iban}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.button
        className="w-full flex items-center justify-center gap-2 glass rounded-2xl p-3 text-destructive"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.98 }}
        onClick={signOut}
      >
        <LogOut size={14} />
        <span className="text-sm font-medium">Abmelden</span>
      </motion.button>
    </motion.div>
  );
};

export default Profile;

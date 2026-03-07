import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Link, Palette, Shield, ChevronRight, LogOut } from 'lucide-react';
import { currentUser } from '@/lib/mockData';

const settingsGroups = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Edit Profile', subtitle: 'Name, avatar, IBAN tag' },
      { icon: Link, label: 'API Endpoint', subtitle: 'http://localhost:5000' },
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

const Profile = () => {
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
          S
        </div>
        <h1 className="text-xl font-semibold text-foreground">{currentUser.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{currentUser.iban}</p>
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
              <button
                key={item.label}
                className="w-full flex items-center gap-3 p-4 text-left"
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
      >
        <LogOut size={16} />
        <span className="text-sm font-medium">Sign Out</span>
      </motion.button>
    </motion.div>
  );
};

export default Profile;

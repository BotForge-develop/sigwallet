import { motion } from 'framer-motion';
import type { Contact } from '@/lib/mockData';

interface ContactAvatarProps {
  contact: Contact;
  index: number;
  onSelect: (contact: Contact) => void;
  size?: 'sm' | 'md';
}

const ContactAvatar = ({ contact, index, onSelect, size = 'md' }: ContactAvatarProps) => {
  const sizeClass = size === 'sm' ? 'w-12 h-12 text-xs' : 'w-14 h-14 text-sm';

  return (
    <motion.button
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onSelect(contact)}
    >
      <div className={`${sizeClass} rounded-full gradient-beige flex items-center justify-center font-semibold text-primary-foreground`}>
        {contact.initials}
      </div>
      <span className="text-[11px] text-muted-foreground font-medium">{contact.name}</span>
    </motion.button>
  );
};

export default ContactAvatar;

export interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
}

export interface Contact {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  iban?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  amount?: number;
  timestamp: string;
  type: 'text' | 'transfer';
}

export const currentUser = {
  id: 'user-1',
  name: 'Simon',
  balance: 12847.53,
  cardLast4: '4291',
  iban: 'DE89 3704 0044 0532 0130 00',
};

export const contacts: Contact[] = [
  { id: 'c1', name: 'Alex', initials: 'AL' },
  { id: 'c2', name: 'Marie', initials: 'MA' },
  { id: 'c3', name: 'Tom', initials: 'TO' },
  { id: 'c4', name: 'Sarah', initials: 'SA' },
  { id: 'c5', name: 'Jan', initials: 'JA' },
  { id: 'c6', name: 'Lisa', initials: 'LI' },
];

export const transactions: Transaction[] = [
  { id: 't1', name: 'Apple Store', category: 'Shopping', amount: -249.99, date: '2026-03-07', icon: 'ShoppingBag' },
  { id: 't2', name: 'Salary', category: 'Income', amount: 4500.00, date: '2026-03-05', icon: 'Building2' },
  { id: 't3', name: 'Netflix', category: 'Entertainment', amount: -15.99, date: '2026-03-04', icon: 'Tv' },
  { id: 't4', name: 'Uber', category: 'Transport', amount: -23.40, date: '2026-03-03', icon: 'Car' },
  { id: 't5', name: 'Rewe', category: 'Groceries', amount: -67.82, date: '2026-03-02', icon: 'ShoppingCart' },
  { id: 't6', name: 'Transfer from Alex', category: 'Transfer', amount: 150.00, date: '2026-03-01', icon: 'ArrowDownLeft' },
  { id: 't7', name: 'Gym Membership', category: 'Health', amount: -49.90, date: '2026-02-28', icon: 'Dumbbell' },
];

export const spendingData = [
  { day: 'Mon', amount: 120 },
  { day: 'Tue', amount: 85 },
  { day: 'Wed', amount: 210 },
  { day: 'Thu', amount: 45 },
  { day: 'Fri', amount: 180 },
  { day: 'Sat', amount: 320 },
  { day: 'Sun', amount: 90 },
];

export const mockChats: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'm1', senderId: 'c1', text: 'Hey, dinner was great last night!', timestamp: '2026-03-06T18:30:00', type: 'text' },
    { id: 'm2', senderId: 'user-1', text: 'Agreed! Here\'s my half 🍕', timestamp: '2026-03-06T18:31:00', type: 'text' },
    { id: 'm3', senderId: 'user-1', amount: 35.50, timestamp: '2026-03-06T18:31:30', type: 'transfer' },
    { id: 'm4', senderId: 'c1', text: 'Thanks! 🙏', timestamp: '2026-03-06T18:32:00', type: 'text' },
  ],
  c2: [
    { id: 'm5', senderId: 'user-1', text: 'Movie tickets for Saturday?', timestamp: '2026-03-05T14:00:00', type: 'text' },
    { id: 'm6', senderId: 'c2', text: 'Yes! Can\'t wait', timestamp: '2026-03-05T14:05:00', type: 'text' },
  ],
};

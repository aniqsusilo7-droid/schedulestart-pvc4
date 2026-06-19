import { ReactorConfig } from './types';

export const REACTORS: ReactorConfig[] = [
  { id: 'O', name: 'Reaktor O', label: 'O', color: 'bg-red-600', textColor: 'text-white', subLabel: '' },
  { id: 'P', name: 'Reaktor P', label: 'P', color: 'bg-orange-500', textColor: 'text-white', subLabel: '' },
  { id: 'Q', name: 'Reaktor Q', label: 'Q', color: 'bg-yellow-300', textColor: 'text-black', subLabel: '' },
  { id: 'R', name: 'Reaktor R', label: 'R', color: 'bg-green-600', textColor: 'text-white', subLabel: '' },
];

export const GRADE_COLORS: Record<string, string> = {
  SM: 'bg-blue-600',
  SLK: 'bg-green-600',
  SLP: 'bg-orange-500',
  SE: 'bg-purple-600',
  SR: 'bg-red-600'
};

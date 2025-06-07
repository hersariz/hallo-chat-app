'use client';

import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

type I18nextClientProviderProps = {
  children: ReactNode;
};

export default function I18nextClientProvider({ children }: I18nextClientProviderProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
} 
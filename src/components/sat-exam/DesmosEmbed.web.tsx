import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useL } from '@/i18n/useL';

type DesmosCalculator = { destroy: () => void; resize: () => void };
type DesmosApi = { GraphingCalculator: (element: HTMLElement, options?: Record<string, unknown>) => DesmosCalculator };
declare global { interface Window { Desmos?: DesmosApi } }

const API_KEY = process.env.EXPO_PUBLIC_DESMOS_API_KEY ?? '';
let scriptPromise: Promise<void> | null = null;

function loadDesmos(apiKey: string, lang: string): Promise<void> {
  if (window.Desmos) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.desmos.com/api/v1.12/calculator.js?apiKey=${encodeURIComponent(apiKey)}&lang=${encodeURIComponent(lang)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = null; reject(new Error('Desmos could not be loaded')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Web-only official Desmos API embed. The app keeps working without an API key. */
export function DesmosEmbed() {
  const { L, locale } = useL();
  const host = useRef<HTMLDivElement>(null);
  const calculator = useRef<DesmosCalculator | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API_KEY || !host.current) return;
    let active = true;
    void loadDesmos(API_KEY, locale === 'en' ? 'en' : 'vi')
      .then(() => {
        if (!active || !host.current || !window.Desmos) return;
        calculator.current = window.Desmos.GraphingCalculator(host.current, {
          expressions: true,
          keypad: true,
          settingsMenu: true,
          zoomButtons: true,
          fontSize: 16,
          degreeMode: true,
        });
      })
      .catch(() => { if (active) setError(true); });
    return () => {
      active = false;
      calculator.current?.destroy();
      calculator.current = null;
    };
  }, [locale]);

  if (!API_KEY) {
    return (
      <View style={{ width: '100%', height: 'min(72vh, 680px)', minHeight: 440, borderRadius: 16, overflow: 'hidden' }}>
        <iframe
          src="https://www.desmos.com/calculator?embed"
          style={{ width: '100%', height: '100%', border: '1px solid #E5E7EB', borderRadius: 16 }}
          title="Desmos Graphing Calculator"
        />
      </View>
    );
  }

  return (
    <View>
      {error ? <Text className="mb-2 font-sans text-label text-danger">{L('Chưa tải được Desmos. Hãy kiểm tra kết nối mạng và API key.', 'Could not load Desmos. Check the network and API key.')}</Text> : null}
      <div ref={host} style={{ width: '100%', height: 'min(72vh, 680px)', minHeight: 440, borderRadius: 16, overflow: 'hidden', border: '1px solid #F3F0FB' }} />
    </View>
  );
}

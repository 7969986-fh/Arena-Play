import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function Contact() {
  return (
    <InfoPage
      title="Contact Us"
      sections={[
        { heading: 'Support hours', body: '10 AM to 10 PM, every day.' },
        { heading: 'Email', body: 'support@arenaplay.app' },
        { heading: 'Response time', body: 'We typically respond within a few hours during support hours. For match disputes, keep your screen recording ready as evidence.' },
      ]}
    />
  );
}

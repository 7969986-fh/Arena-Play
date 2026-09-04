import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      sections={[
        { heading: 'Information we collect', body: 'We collect your username, email and in-game name to run contests and identify winners.' },
        { heading: 'How we use it', body: 'Your data is used to manage your account, wallet, contests and payouts. We never sell your personal data.' },
        { heading: 'Wallet & coins', body: 'Coins in Arena Play are virtual and used only inside the app. Withdrawals of winnings are processed to your provided UPI ID.' },
        { heading: 'Contact', body: 'For any privacy questions, reach us through the Contact Us screen.' },
      ]}
    />
  );
}

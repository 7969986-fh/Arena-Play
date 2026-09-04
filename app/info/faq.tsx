import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function FAQ() {
  return (
    <InfoPage
      title="FAQ"
      sections={[
        { heading: 'How do I join a contest?', body: 'Open a game from the home screen, pick a contest, choose an open slot, enter your in-game name and confirm. The entry fee is deducted from your wallet.' },
        { heading: 'How do I get room ID & password?', body: 'Once a paid contest goes live and you have joined, the room ID and password appear on the contest details screen.' },
        { heading: 'How is the winner decided?', body: 'Winners are decided by placement and kills as per each contest’s prize breakdown. Results are declared by admins after the match.' },
        { heading: 'How do I withdraw?', body: 'Only your winnings balance is withdrawable. Go to Wallet → Withdraw, enter the amount and your UPI ID.' },
        { heading: 'Why is screen recording required?', body: 'Screen recording is used as evidence in case of disputes or suspected cheating. It keeps contests fair for everyone.' },
      ]}
    />
  );
}

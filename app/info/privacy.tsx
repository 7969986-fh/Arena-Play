import React from 'react';
import InfoPage from '@/components/InfoPage';
import { APP } from '@/constants/app';

export default function Privacy() {
  return (
    <InfoPage
      title="Privacy Policy"
      sections={[
        {
          body: `This policy explains what ${APP.name} collects, why, and what you can ask us to do with it. It applies to the app and everything you do inside it.`,
        },
        {
          heading: 'What we collect',
          body:
            'Account details you give us: your username, email address and the in-game name you enter when joining a match.\n\n' +
            'Activity we record as you play: matches joined, kills and placements, coin balances and every wallet transaction.\n\n' +
            'Payment evidence you upload: your UPI payment screenshot and reference number for a deposit, the UPI ID you want winnings sent to, and match result screenshots.\n\n' +
            'We do not collect your contacts, location, or anything from other apps on your device.',
        },
        {
          heading: 'Why we collect it',
          body:
            'To run your account and wallet, place you in matches, verify results and pay out winnings. Payment screenshots exist so a human can confirm a deposit actually arrived before crediting coins. Result screenshots exist so prizes are settled on evidence rather than on claims.',
        },
        {
          heading: 'Who can see it',
          body:
            'Your username, in-game name, level and match results are visible to other players on the leaderboard and in match lobbies — that is the point of a public contest.\n\n' +
            'Your email address, wallet balances, transaction history, UPI ID and uploaded screenshots are visible only to you and to our admin staff.\n\n' +
            'We do not sell your data or share it with advertisers.',
        },
        {
          heading: 'Where it is stored',
          body:
            'Account data is held in our hosted database. Screenshots are stored in our file storage. Both are protected by access rules that stop one player reading another player’s private records.\n\n' +
            'No system is perfectly secure, and we cannot promise absolute security — but wallet balances can never be altered from the app itself, only by verified server-side operations.',
        },
        {
          heading: 'How long we keep it',
          body:
            'Account and transaction records are kept while your account exists and for a reasonable period afterwards, so that payment disputes can still be resolved. Deposit and result screenshots are kept while the related match or payment can still be questioned.',
        },
        {
          heading: 'Your choices',
          body:
            'You can ask us for a copy of your data, ask for corrections, or ask us to delete your account. Contact us through the Contact Us screen.\n\n' +
            'Deleting your account removes your profile and play history. We may keep minimal records of completed payments where we are required to.',
        },
        {
          heading: 'Children',
          body: `${APP.name} is not intended for anyone under 18. If we learn an account belongs to a minor, we will close it.`,
        },
        {
          heading: 'Changes',
          body: 'If this policy changes materially, we will announce it in the app. Continuing to use the app after that means you accept the updated policy.',
        },
        {
          heading: 'Contact',
          body: 'Any privacy question or request can be raised through the Contact Us screen.',
        },
      ]}
    />
  );
}

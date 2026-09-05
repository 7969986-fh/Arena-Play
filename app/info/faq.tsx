import React from 'react';
import InfoPage from '@/components/InfoPage';
import { APP } from '@/constants/app';

export default function FAQ() {
  return (
    <InfoPage
      title="FAQ"
      sections={[
        {
          heading: 'How do I add coins?',
          body:
            `Wallet → Recharge. Pick an amount, pay to ${APP.upiId} from any UPI app, then attach the payment screenshot and the UPI reference number.\n\n` +
            'An admin checks the payment arrived and credits your coins, usually within a few hours.',
        },
        {
          heading: 'Do I get extra coins for adding more?',
          body:
            'Yes. ₹50 gives 5 bonus coins, ₹100 gives 15, ₹200 gives 35, ₹300 gives 60 and ₹500 gives 100. Bonus coins pay entry fees but cannot be withdrawn.',
        },
        {
          heading: 'How do I join a contest?',
          body:
            'Open a game from home, pick a contest, choose an open slot, enter your exact in-game name, read the rules and accept them. The entry fee comes out of your wallet when you join.',
        },
        {
          heading: 'Where is the room ID and password?',
          body:
            'On the contest screen, once you have joined and staff have shared them — usually 5–10 minutes before the match. You also get a reminder 30 minutes and 5 minutes before it starts.',
        },
        {
          heading: 'How is the winner decided?',
          body:
            'By your placement and your kills, against the prize breakdown shown on that contest. Staff enter results after the match, and prizes are credited automatically.',
        },
        {
          heading: 'Why do I need to upload a screenshot?',
          body:
            'Your end-of-match screenshot is what staff check your result against. It is also your evidence if someone disputes the outcome. Keep a POV screen recording too — replays are not accepted.',
        },
        {
          heading: 'How do I withdraw?',
          body:
            'Wallet → Withdraw. Only your winnings balance can be withdrawn — deposit and bonus coins are for playing. Enter the amount and your UPI ID, and an admin processes the payout.',
        },
        {
          heading: 'When do I not get a refund?',
          body:
            'If you do not turn up, join with the wrong in-game name, or leave early. You are refunded if the match is cancelled, staff remove you, or the room was full and you can prove it.',
        },
        {
          heading: 'What gets me banned?',
          body:
            'Hacks, mods, exploiting bugs, teaming with opponents, emulators where they are banned, or abusing players and staff. Bans are permanent and any balance is forfeited.',
        },
        {
          heading: 'Something went wrong. What now?',
          body:
            'Contact us within 2 hours of the match ending, with your recording. After that the declared result stands. See Contact Us for WhatsApp and Telegram.',
        },
      ]}
    />
  );
}

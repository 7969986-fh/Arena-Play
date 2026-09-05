import React from 'react';
import InfoPage from '@/components/InfoPage';
import { APP } from '@/constants/app';

export default function Terms() {
  return (
    <InfoPage
      title="Terms & Refunds"
      sections={[
        {
          body: `By creating an account you agree to these terms. If you do not agree with them, do not use ${APP.name}.`,
        },
        {
          heading: 'Who can play',
          body:
            'You must be 18 or over and playing from somewhere these contests are permitted. It is your responsibility to know the rules where you live.\n\n' +
            'One account per person. Extra accounts made to claim bonuses more than once will be closed and their balances forfeited.',
        },
        {
          heading: 'Skill, not chance',
          body:
            'Contests are decided by how you play — your placement and your kills. Prizes follow the published prize breakdown for each match. No part of the result is random.',
        },
        {
          heading: 'Your wallet',
          body:
            'Coins come in three kinds and they behave differently:\n\n' +
            'Deposit — coins you paid for. Spendable on entry fees. Not withdrawable.\n\n' +
            'Bonus — coins from sign-up, deposit tiers, daily rewards and referrals. Spendable on entry fees. Not withdrawable.\n\n' +
            'Winnings — coins you won in a contest. Spendable on entry fees, and the only balance that can be withdrawn.\n\n' +
            'Entry fees are taken from bonus first, then deposit, then winnings.',
        },
        {
          heading: 'Deposits',
          body:
            `Deposits are made by UPI transfer to ${APP.upiId}, with a screenshot and reference number attached in the app. Coins are credited once an admin has verified the payment arrived, normally within a few hours.\n\n` +
            'A deposit sent without a screenshot, or with details that do not match the payment we received, cannot be credited until you contact support with proof.',
        },
        {
          heading: 'Withdrawals and refunds',
          body:
            'Winnings can be withdrawn to the UPI ID you supply. The requested amount is held from your balance when you request it, and released back if the request is rejected.\n\n' +
            'Deposits are not refundable once coins are credited, because those coins can immediately be spent on entry.\n\n' +
            'Your entry fee is refunded automatically if: the match is cancelled, staff remove you from a match, or the room is full and you can show a recording of it.\n\n' +
            'Your entry fee is not refunded if you simply do not turn up, join with the wrong in-game name, or leave the match early.',
        },
        {
          heading: 'Fair play',
          body:
            'These end a match and can end your account permanently, with any balance forfeited:\n\n' +
            'Hacks, mods, scripts or exploiting bugs.\nTeaming with opponents.\nPlaying on an emulator or PC where the match forbids it.\nUsing an in-game name other than the one you registered.\nAbusing other players or staff.\n\n' +
            'You may be asked for a POV recording of your gameplay. Prizes can be withheld until it is provided. Replays are not accepted as evidence.',
        },
        {
          heading: 'Disputes',
          body:
            'Raise any issue with a match within 2 hours of it ending, through the Contact Us screen, with your evidence. After that the declared result stands.\n\n' +
            'We review the evidence and decide. Our decision on a contest result is final.',
        },
        {
          heading: 'Suspension',
          body:
            'We can suspend or close an account that breaks these terms, that we reasonably believe is being used fraudulently, or that is being used to abuse our payment or bonus systems. Where a balance was built by breaking these terms, it is forfeited.',
        },
        {
          heading: 'Availability',
          body:
            'We aim to keep the app running but cannot guarantee it is always available. Matches may be delayed or cancelled — entry fees are refunded when that happens. We are not liable for losses caused by your own device, network or in-game connection.',
        },
        {
          heading: 'Changes',
          body: 'These terms may change. Material changes will be announced in the app, and continuing to play after that means you accept them.',
        },
      ]}
    />
  );
}

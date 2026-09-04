import React from 'react';
import InfoPage from '@/components/InfoPage';

export default function About() {
  return (
    <InfoPage
      title="About Us"
      sections={[
        { body: 'Arena Play is an esports contest platform where players compete in skill-based matches, climb the leaderboard, and win rewards.' },
        { heading: 'Our mission', body: 'To give every mobile gamer a fair, fun and rewarding place to compete — from casual free matches to high-stakes tournaments.' },
        { heading: 'Fair play', body: 'We take fair play seriously. Cheating, teaming and the use of unfair tools result in permanent bans.' },
      ]}
    />
  );
}

import React from 'react';
import HomePage from './HomePage';

/**
 * LandingPage wraps the premier redesigned HomePage experience,
 * ensuring users visiting either `/` or `/landing` get the full
 * state-of-the-art AgriTech e-commerce & training experience.
 */
export default function LandingPage(props) {
  return <HomePage {...props} />;
}

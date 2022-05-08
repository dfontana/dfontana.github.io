import React, { useState, useEffect } from 'react';
import { css } from "@emotion/react";

// day is nullable, signifying next day. Otherwise it's the day code
// for the next day of week to count until
function timeUntil(hour, day) {
  const now = new Date();
  const isAfterHour = now.getUTCHours() >= hour

  let target = new Date();
  target.setUTCHours(hour);
  target.setUTCMinutes(0);
  target.setUTCSeconds(0);

  if (day != null) {
    if (now.getUTCDay() == day && isAfterHour) {
      // Jump the target a full week to the next day occurance
      target.setUTCDate(target.getUTCDate() + 7);
    } else {
      // Determine days until day is hit via subtract w/ wrap-around
      let daysUntilDay = (7 + day - target.getUTCDay()) % 7;
      target.setUTCDate(target.getUTCDate() + daysUntilDay);
    }
  } else if (isAfterHour) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  let secondsLeft = (target.getTime() - new Date().getTime()) / 1000;
  return {
    days: Math.floor(secondsLeft / 86400),
    hours: Math.floor(secondsLeft % 86400 / 3600),
    minutes: Math.floor(secondsLeft % 3600 / 60),
    seconds: Math.floor(secondsLeft % 60)
  }
}

function Countdown({
  label,
  hour,
  day = null
}) {
  let [left, setLeft] = useState(timeUntil(hour, day));

  useEffect(() => {
    setInterval(() => {
      setLeft(timeUntil(hour, day))
    }, 1000);
  }, [setLeft, hour, day]);

  return (
    <div>
      <div
        css={css`
          display: inline-block;
          width: 75px;
        `}
      >
        {label}
      </div>
      <div
        css={css`
          display: inline-block;
          width: 150px;
          font-family: monospace;
          font-size: 14px;
        `}
      >
        {left.days}d {left.hours}h {left.minutes}m {left.seconds}s
      </div>
    </div>
  )
}

export default Countdown;

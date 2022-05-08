import React, { useState } from 'react';
import { css } from "@emotion/react";
// TODO actually countdown
// Daily reset is 10am UTC
// Weekly reset is 10am UTC Thursdays
function Countdown({
  label
}) {
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
          width: 100px;
        `}
      >
        -10:00:00
      </div>
    </div>
  )
}

export default Countdown;

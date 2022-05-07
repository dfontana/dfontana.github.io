import React, { useState } from 'react';
import { css } from "@emotion/react";

export default function App() {
 const [liked, setLiked] = useState(false);

  return liked 
    ? 'You liked this'
    : (
      <button 
        css={css`
          background: hotpink
        `} 
        onClick={() => setLiked(true)}>Like</button>
    )
}


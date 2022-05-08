import React, { useState } from 'react';
import { css } from "@emotion/react";

function TextInput({
  onSubmit,
  ...rest
}) {
  const [input, setInput] = useState("");

  const onKeyPress = event => {
    if (event.key === 'Enter' && !!event.target.value.trim() && event.target.validity.valid) {
      event.preventDefault();
      let v = input;
      setInput("");
      onSubmit(v);
    }
  };

  return (
    <input
      {...rest}
      css={css`
        position: absolute;
        right: 0;
        bottom: 0;
        padding: 5 10;
        border: 1px solid black;
        border-radius: 4px;
      `}
      type="text"
      value={input}
      onChange={event => setInput(event.target.value)}
      onKeyPress={onKeyPress}
    />
  )
}

export default TextInput;

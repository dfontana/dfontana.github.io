import React from 'react';
import styled from '@emotion/styled'

const StyledDiv = styled.div(props => `
  display: inline-block;
  margin: 0 1;

  width: 20px;
  height: 20px;
  font-size: 14;
  text-align: center;

  cursor: pointer;
  background: ${props.checked ? 'green' : 'white'};
  color: ${props.checked ? 'white' : 'black'};

  border-radius: 4px;
  border: 1px solid transparent;
  box-sizing: border-box;  
  &:hover {
    border: 1px solid black;
  }
`)

function CheckButton({
  displayText,
  checked,
  onClick
}) {
  return (
    <StyledDiv
      checked={checked}
      onClick={onClick}
    >
      {displayText}
    </StyledDiv>
  )
}

export default CheckButton;

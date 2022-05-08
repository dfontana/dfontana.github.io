import React from 'react';
import styled from '@emotion/styled'
import { css } from "@emotion/react";
import CheckButton from './checkButton';

const SectionDiv = styled.div`
  border: 3px solid black;
  border-radius: 5px;
  margin: 5 0;
  padding: 5px;
`;
const SectionTitle = styled.div`
  display: inline-block;
  width: 200px;
  font-size: 20px;
  font-weight: bold;
`;
const CharacterName = styled.div`
  display: inline-block;
  box-sizing: border-box;
  width: 200px;
  overflow-x: clip;
  padding-left: 15px;
`;
// TODO alternating stripes on each row
const Buttons = styled.div`
  display: inline-flex;
  justify-content: center;
  width: 100px;
`;
const Title = styled.div`
  display: inline-block;
  width: 100px;
  text-align: center;
  font-size: 13px;
  font-style: italic;
  opacity: 50%;
`;

function Section({
  dataKey,
  title,
  chars,
  toggleDaily,
  toggleWeekly
}) {
  return (
    <SectionDiv>
      <SectionTitle>{title}</SectionTitle>
      <Title>Daily</Title>
      <Title>Weekly</Title>
      {Object.entries(chars).map(([k, v]) => (
        <div key={k}>
          <CharacterName>{k}</CharacterName>
          <Buttons>
            {v.daily.map((checked, idx) => (
              <CheckButton
                key={idx}
                displayText={idx}
                checked={checked}
                onClick={() => toggleDaily(dataKey, k, idx)}
              />
            ))}
          </Buttons>
          <Buttons>
            {v.weekly?.map((checked, idx) => (
              <CheckButton
                key={idx}
                displayText={idx}
                checked={checked}
                onClick={() => toggleWeekly(dataKey, k, idx)}
              />
            ))}
          </Buttons>
        </div>
      ))}
    </SectionDiv>
  )
}

export default Section;

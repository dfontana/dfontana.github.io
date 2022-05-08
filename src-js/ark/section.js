import React from 'react';
import styled from '@emotion/styled'
import CheckButton from './checkButton';

const SectionDiv = styled.div`
  min-width: 370px;
  border: 3px solid black;
  border-radius: 5px;
  box-sizing: border-box;
  margin: 5 2;
  padding: 5px;
`;
const SectionTitle = styled.div`
  display: inline-block;
  width: 180px;
  font-size: 20px;
  font-weight: bold;
`;
const CharacterName = styled.div`
  display: inline-block;
  box-sizing: border-box;
  width: 180px;
  overflow-x: clip;
  padding-left: 15px;
`;
const Buttons = styled.div`
  display: inline-flex;
  justify-content: center;
  width: 80px;
`;
const Title = styled.div`
  display: inline-block;
  width: 80px;
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

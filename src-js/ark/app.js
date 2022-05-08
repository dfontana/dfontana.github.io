import React from 'react';
import { css } from "@emotion/react";
import { useLocalStorage } from './useLocalStorage.js';
import Section from './section.js';
import TextInput from './textInput.js';
import Countdown from './countdown.js';
import { Model, AddCharacter, TITLES, RESET_KEYS, UpdateTask } from './model.js';


export default function App() {
  const [tasks, setTasks, resetTasks] = useLocalStorage('ark-todos', Model());

  // TODO show tooltip on hover if add char box disabled/invalid (explaining rules)
  // TODO disable button bank for char until next reset 
  //      if completed.
  // TODO clear state on reset
  // TODO show animation on bank completion, highlighting
  //      entire row in some way. Need to distinguish from
  //      weeklies which should highlight in some other way
  // TODO alternating stripes on each character row for easier lineup)
  // TODO ability to re-order chars
  // TODO ability to re-order sections
  // TODO consider icons next to specific chars to signify
  //      main vs alt1 vs alt2 vs...
  // TODO consider icons to signify solo vs group content
  // TODO consider multiple rosters possible (max 6 char each)

  const toggleDaily = (key, charKey, idx) => setTasks(prev => UpdateTask(prev, key, charKey, RESET_KEYS.DAY, idx));
  const toggleWeekly = (key, charKey, idx) => setTasks(prev => UpdateTask(prev, key, charKey, RESET_KEYS.WEK, idx));

  const addCharacter = name => setTasks(prev => AddCharacter(prev, name));

  const removeCharacter = name => {
    if (window.confirm(`Remove ${name} from Roster?`)) {
      // TODO ability to remove specific char
    }
  }

  const resetStorage = () => {
    if (window.confirm("Delete all saved data?")) {
      resetTasks();
    }
  }

  return (
    <>
      <div css={css`position: relative;`}>
        <div css={css`display: inline-block`}>
          <Countdown label="Daily" hour={10} />
          <Countdown label="Weekly" hour={10} day={4} />
        </div>
        <a
          css={css`
            font-size: 9;
            position: absolute;
            right: 0;
          `}
          onClick={resetStorage}
        >
          Remove All Data
        </a>
        <TextInput
          placeholder="Add Character"
          maxLength={16}
          minLength={1}
          pattern="[A-Z,a-z]{1}[a-z]*"
          disabled={Object.keys(tasks.chars).length >= 6}
          onSubmit={addCharacter}
        />
      </div>
      <div
        css={css`
          display: flex;
          flex-wrap: wrap;
        `}
      >
        {tasks.sections.map(({ key }) => (
          <Section
            key={key}
            dataKey={key}
            title={TITLES[key]}
            chars={tasks[key]}
            toggleDaily={toggleDaily}
            toggleWeekly={toggleWeekly}
          />
        ))}
      </div>
    </>
  )
}


import React, { useMemo, useEffect } from 'react';
import { css } from "@emotion/react";
import { useLocalStorage } from './useLocalStorage.js';
import Section from './section.js';
import TextInput from './textInput.js';
import Countdown from './countdown.js';
import { Model, Character, TITLES } from './model.js';


export default function App() {
  // TODO ability to reset state
  const [tasks, setTasks] = useLocalStorage('ark-todos', Model());

  // TODO optimize. I don't like how entire page re-renders
  // Not sure why atm, it's something obvious here.

  // TODO disable button bank for char until next reset 
  //      if completed.
  // TODO show animation on bank completion, highlighting
  //      entire row in some way. Need to distinguish from
  //      weeklies which should highlight in some other way
  const toggleDaily = useMemo(() => (key, charKey, idx) => {
    setTasks(prev => {
      let updating = [...prev[key][charKey].daily];
      updating[idx] = !prev[key][charKey].daily[idx];
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [charKey]: {
            ...prev[key][charKey],
            daily: updating
          }
        }
      }
    });
  }, [setTasks])

  const toggleWeekly = useMemo(() => (key, charKey, idx) => {
    setTasks(prev => {
      let updating = [...prev[key][charKey].weekly];
      updating[idx] = !prev[key][charKey].weekly[idx];
      return {
        ...prev,
        [key]: {
          ...prev[key],
          [charKey]: {
            ...prev[key][charKey],
            weekly: updating
          }
        }
      }
    });
  }, [setTasks])

  // TODO ability to remove char
  // TODO validate name is ok length, characters
  // TODO validate not adding more than 6 to current roster
  const addCharacter = name => {
    setTasks(prev => {
      let updating = { ...prev };
      prev.sections.forEach(section => {
        updating[section.key] = {
          ...updating[section.key],
          [name]: Character(section.key)
        }
      })
      return updating
    })
  }

  // TODO ability to re-order chars
  // TODO ability to re-order sections
  // TODO consider icons next to specific chars to signify
  //      main vs alt1 vs alt2 vs...
  // TODO consider multiple rosters possible (max 6 char each)
  return (
    <>
      <div css={css`position: relative;`}>
        <div css={css`display: inline-block`}>
          <Countdown label="Daily" />
          <Countdown label="Weekly" />
        </div>
        {/* TODO add validations  */}
        <TextInput
          placeholder="Add Character"
          onSubmit={addCharacter}
        />
      </div>
      <div>
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


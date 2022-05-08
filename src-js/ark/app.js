import React, { useMemo } from 'react';
import { css } from "@emotion/react";
import { useLocalStorage } from './useLocalStorage.js';
import Section from './section.js';
import TextInput from './textInput.js';
import Countdown from './countdown.js';
import { Model, Character, TITLES } from './model.js';


export default function App() {
  const [tasks, setTasks, resetTasks] = useLocalStorage('ark-todos', Model());

  // TODO show tooltip on hover if add char box disabled/invalid (explaining rules)

  // TODO optimize. I don't like how entire page re-renders on checkbutton click
  // Not sure why atm, it's something obvious here.

  // TODO disable button bank for char until next reset 
  //      if completed.
  // TODO clear state on reset
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


  const addCharacter = name => {
    setTasks(prev => {
      let updating = { ...prev, chars: { ...prev.chars, [name]: {} } };
      prev.sections.forEach(section => {
        updating[section.key] = {
          ...updating[section.key],
          [name]: Character(section.key)
        }
      })
      return updating
    })
  }

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

  // TODO ability to re-order chars
  // TODO ability to re-order sections
  // TODO consider icons next to specific chars to signify
  //      main vs alt1 vs alt2 vs...
  // TODO consider icons to signify solo vs group content
  // TODO consider multiple rosters possible (max 6 char each)
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


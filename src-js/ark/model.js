const TASK_KEYS = {
  CHAOS_DG: "chaosDungeon",
  ABYSS_DG: "abyssDungeon",
  GUARD_RD: "guardinRaid",
  UNA_TASK: "unaTasks",
}
const TITLES = {
  [TASK_KEYS.CHAOS_DG]: "Chaos Dungeon",
  [TASK_KEYS.ABYSS_DG]: "Abyss Dungeon",
  [TASK_KEYS.GUARD_RD]: "Guardian Raid",
  [TASK_KEYS.UNA_TASK]: "Una Tasks",
}
const RESET_KEYS = {
  WEK: 'weekly',
  DAY: 'daily',
}

function Model() {
  return {
    sections: [
      { key: TASK_KEYS.CHAOS_DG, order: 1 },
      { key: TASK_KEYS.ABYSS_DG, order: 2 },
      { key: TASK_KEYS.GUARD_RD, order: 3 },
      { key: TASK_KEYS.UNA_TASK, order: 4 },
    ],
    chars: {},
    [TASK_KEYS.CHAOS_DG]: {},
    [TASK_KEYS.ABYSS_DG]: {},
    [TASK_KEYS.GUARD_RD]: {},
    [TASK_KEYS.UNA_TASK]: {}
  }
}

function AddCharacter(model, charName) {
  let updating = {
    ...model,
    chars: {
      ...model.chars,
      [charName]: {}
    }
  };
  for (const section of model.sections) {
    let sectionBody = {
      [RESET_KEYS.DAY]: [false, false],
      [RESET_KEYS.WEK]: [],
    };
    switch (section.key) {
      case TASK_KEYS.ABYSS_DG:
        sectionBody = {
          [RESET_KEYS.DAY]: [false],
          [RESET_KEYS.WEK]: [],
        }
        break
      case TASK_KEYS.UNA_TASK:
        sectionBody = {
          [RESET_KEYS.DAY]: [false, false, false],
          [RESET_KEYS.WEK]: [false, false],
        }
        break;
    }
    updating[section.key] = {
      ...updating[section.key],
      [charName]: sectionBody
    }
  }
  return updating
}

function UpdateTask(model, taskKey, charKey, resetKey, idx) {
  let updating = [...model[taskKey][charKey][resetKey]];
  updating[idx] = !model[taskKey][charKey][resetKey][idx];
  return {
    ...model,
    [taskKey]: {
      ...model[taskKey],
      [charKey]: {
        ...model[taskKey][charKey],
        [resetKey]: updating
      }
    }
  }
}

export {
  Model,
  AddCharacter,
  UpdateTask,
  TASK_KEYS,
  RESET_KEYS,
  TITLES
}

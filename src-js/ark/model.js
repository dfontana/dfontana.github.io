const KEYS = {
  CHAOS_DG: "chaosDungeon",
  ABYSS_DG: "abyssDungeon",
  GUARD_RD: "guardinRaid",
  UNA_TASK: "unaTasks",
}
const TITLES = {
  [KEYS.CHAOS_DG]: "Chaos Dungeon",
  [KEYS.ABYSS_DG]: "Abyss Dungeon",
  [KEYS.GUARD_RD]: "Guardian Raid",
  [KEYS.UNA_TASK]: "Una Tasks",
}

function Character(key) {
  switch (key) {
    case KEYS.ABYSS_DG:
      return {
        daily: [false],
        weekly: [],
      }
    case KEYS.UNA_TASK:
      return {
        daily: [false, false, false],
        weekly: [false, false],
      }
    default:
      return {
        daily: [false, false],
        weekly: [],
      }
  }
}

function Model() {
  return {
    sections: [
      { key: KEYS.CHAOS_DG, order: 1 },
      { key: KEYS.ABYSS_DG, order: 2 },
      { key: KEYS.GUARD_RD, order: 3 },
      { key: KEYS.UNA_TASK, order: 4 },
    ],
    [KEYS.CHAOS_DG]: Character(KEYS.CHAOS_DG),
    [KEYS.ABYSS_DG]: Character(KEYS.ABYSS_DG),
    [KEYS.GUARD_RD]: Character(KEYS.GUARD_RD),
    [KEYS.UNA_TASK]: Character(KEYS.UNA_TASK)
  }
}

export {
  Model,
  Character,
  KEYS,
  TITLES
}

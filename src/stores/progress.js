import { reactive, watch } from 'vue'

const STORAGE_KEY = 'hanzi-kingdom-progress'

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn('读取进度失败', e)
  }
  return {
    stars: 0,
    badges: [],
    records: {},
  }
}

const state = reactive(loadProgress())

watch(
  () => state,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.warn('保存进度失败', e)
    }
  },
  { deep: true }
)

export function useProgress() {
  function addStars(count = 1) {
    state.stars += count
    return state.stars
  }

  function getStars() {
    return state.stars
  }

  function addBadge(badge) {
    if (!state.badges.find((b) => b.id === badge.id)) {
      state.badges.push(badge)
    }
  }

  function getBadges() {
    return state.badges
  }

  function recordGame(gameId, result) {
    if (!state.records[gameId]) {
      state.records[gameId] = {
        playCount: 0,
        correctCount: 0,
        bestStreak: 0,
        lastPlay: null,
      }
    }
    const rec = state.records[gameId]
    rec.playCount += 1
    if (result.correct) {
      rec.correctCount += 1
    }
    rec.lastPlay = new Date().toISOString()
  }

  function getRecords() {
    return state.records
  }

  function resetProgress() {
    state.stars = 0
    state.badges = []
    state.records = {}
  }

  return {
    state,
    addStars,
    getStars,
    addBadge,
    getBadges,
    recordGame,
    getRecords,
    resetProgress,
  }
}

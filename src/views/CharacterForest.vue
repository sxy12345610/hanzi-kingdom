<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgress } from '../stores/progress'
import { characterPuzzles, radicalPuzzles, shuffleArray } from '../data/characters'

const router = useRouter()
const { state, addStars, recordGame } = useProgress()

const gameMode = ref('puzzle') // 'puzzle' | 'radical'
const puzzles = ref([])
const currentIndex = ref(0)
const currentOptions = ref([])
const selected = ref(null)
const answered = ref(false)
const isCorrect = ref(false)
const showFeedback = ref(false)

const current = computed(() => puzzles.value[currentIndex.value])

function shuffleCurrentOptions() {
  if (current.value) {
    currentOptions.value = shuffleArray(current.value.options)
  }
}

const progressText = computed(() => {
  return `${currentIndex.value + 1} / ${puzzles.value.length}`
})

const modeTitle = computed(() => {
  return gameMode.value === 'puzzle' ? '汉字拼拼乐' : '偏旁连连看'
})

const spriteHint = computed(() => {
  return gameMode.value === 'puzzle'
    ? '小朋友，帮汉字精灵找到正确组合吧！'
    : '小朋友，找出藏着这个偏旁的汉字吧！'
})

function loadPuzzles() {
  const source = gameMode.value === 'puzzle' ? characterPuzzles : radicalPuzzles
  puzzles.value = shuffleArray(source).slice(0, 8)
}

function startGame() {
  loadPuzzles()
  currentIndex.value = 0
  shuffleCurrentOptions()
  selected.value = null
  answered.value = false
  isCorrect.value = false
  showFeedback.value = false
}

function switchMode(mode) {
  if (gameMode.value === mode) return
  gameMode.value = mode
  startGame()
}

function choose(opt) {
  if (answered.value) return
  selected.value = opt
  answered.value = true
  isCorrect.value = opt === current.value.answer
  showFeedback.value = true
  if (isCorrect.value) {
    addStars(1)
    // 汉字星 +1，写入 sessionStorage 供成长页读取
    sessionStorage.setItem('hanziStars', String(Number(sessionStorage.getItem('hanziStars') || 0) + 1))
    window.dispatchEvent(new Event('starUpdate')) // 通知成长页实时更新
  }
  const recordId = gameMode.value === 'puzzle' ? 'character-puzzle' : 'radical-match'
  recordGame(recordId, { correct: isCorrect.value })
}

function nextQuestion() {
  if (currentIndex.value < puzzles.value.length - 1) {
    currentIndex.value += 1
    shuffleCurrentOptions()
    selected.value = null
    answered.value = false
    isCorrect.value = false
    showFeedback.value = false
  } else {
    startGame()
  }
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  startGame()
})
</script>

<template>
  <div class="forest-page">
    <!-- 漂浮树叶 -->
    <div class="leaf leaf-1">🍃</div>
    <div class="leaf leaf-2">🍂</div>
    <div class="leaf leaf-3">🍃</div>

    <!-- 顶部栏 -->
    <header class="top-bar">
      <button class="back-btn" @click="goHome">🏠</button>
      <h1 class="title">🌳 汉字森林</h1>
      <div class="star-box">
        <span class="star">⭐</span>
        <span class="star-count">{{ state.stars }}</span>
      </div>
    </header>

    <!-- 模式切换 -->
    <nav class="mode-switch">
      <button
        class="mode-btn"
        :class="{ active: gameMode === 'puzzle' }"
        @click="switchMode('puzzle')"
      >
        🌟 汉字拼拼乐
      </button>
      <button
        class="mode-btn"
        :class="{ active: gameMode === 'radical' }"
        @click="switchMode('radical')"
      >
        🌟 偏旁连连看
      </button>
    </nav>

    <!-- 汉字精灵区域 -->
    <section class="sprite-area">
      <div class="sprite">🧚‍♀️</div>
      <p class="hint">{{ spriteHint }}</p>
      <div class="progress-tag">第 {{ progressText }} 题</div>
    </section>

    <!-- 游戏区域 -->
    <main class="game-area" v-if="current">
      <!-- 汉字拼拼乐 -->
      <div v-if="gameMode === 'puzzle'" class="puzzle-display">
        <span class="char-part">{{ current.left }}</span>
        <span class="plus">+</span>
        <span class="char-part">{{ current.right }}</span>
        <span class="equals">=</span>
        <span class="question">?</span>
      </div>

      <!-- 偏旁连连看 -->
      <div v-else class="radical-display">
        <p class="radical-label">找出含有这个偏旁的汉字：</p>
        <span class="radical-box">{{ current.radical }}</span>
      </div>

      <p class="puzzle-hint" v-if="!answered">💡 {{ current.hint }}</p>

      <!-- 选项按钮 -->
      <div class="options">
        <button
          v-for="opt in currentOptions"
          :key="opt"
          class="option-btn"
          :class="{
            selected: selected === opt,
            correct: answered && opt === current.answer,
            wrong: answered && selected === opt && opt !== current.answer,
          }"
          :disabled="answered"
          @click="choose(opt)"
        >
          {{ opt }}
        </button>
      </div>

      <!-- 反馈区 -->
      <div class="feedback" v-if="showFeedback">
        <transition name="pop" mode="out-in">
          <div :key="isCorrect ? 'ok' : 'no'" class="feedback-card" :class="{ correct: isCorrect, wrong: !isCorrect }">
            <template v-if="isCorrect">
              <div class="feedback-icon">🎉</div>
              <div class="feedback-text">太棒啦！</div>
              <div class="feedback-sub">+1 ⭐ 汉字星</div>
            </template>
            <template v-else>
              <div class="feedback-icon">🌱</div>
              <div class="feedback-text">再试试看！</div>
              <div class="feedback-sub">正确答案是：{{ current.answer }}</div>
            </template>
          </div>
        </transition>

        <button class="next-btn" @click="nextQuestion">
          {{ currentIndex < puzzles.length - 1 ? '下一题 →' : '重新开始 🔄' }}
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.forest-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #a8e6a3 0%, #81c784 50%, #558b2f 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* ===== 漂浮树叶 ===== */
.leaf {
  position: absolute;
  font-size: 36px;
  opacity: 0.7;
  animation: leaf-fall linear infinite;
  pointer-events: none;
  z-index: 1;
}

.leaf-1 {
  top: -5%;
  left: 15%;
  animation-duration: 12s;
}

.leaf-2 {
  top: -5%;
  left: 55%;
  font-size: 30px;
  animation-duration: 15s;
  animation-delay: -4s;
}

.leaf-3 {
  top: -5%;
  left: 80%;
  animation-duration: 14s;
  animation-delay: -8s;
}

@keyframes leaf-fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
  }
  100% {
    transform: translateY(105vh) rotate(360deg);
  }
}

/* ===== 顶部栏 ===== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 5;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.back-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #fff;
  font-size: 26px;
  box-shadow: 0 4px 0 #689f38, 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.back-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #689f38;
}

.title {
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 900;
  color: #2e7d32;
  text-shadow: 2px 2px 0 #fff, 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.star-box {
  background: #fff8e1;
  border: 3px solid #ffc107;
  border-radius: 16px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 0 #ffa000;
}

.star {
  font-size: 24px;
}

.star-count {
  font-size: 22px;
  font-weight: 800;
  color: #f57f17;
}

/* ===== 模式切换 ===== */
.mode-switch {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  z-index: 5;
}

.mode-btn {
  background: #fff;
  color: #558b2f;
  font-size: 15px;
  font-weight: 800;
  padding: 10px 18px;
  border-radius: 30px;
  border: 3px solid #a5d6a7;
  box-shadow: 0 4px 0 #81c784;
  transition: all 0.15s ease;
}

.mode-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #81c784;
}

.mode-btn.active {
  background: #ff9800;
  color: #fff;
  border-color: #ef6c00;
  box-shadow: 0 4px 0 #e65100;
}

.mode-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #81c784;
}

.mode-btn.active:active {
  box-shadow: 0 2px 0 #e65100;
}

/* ===== 汉字精灵区域 ===== */
.sprite-area {
  text-align: center;
  z-index: 3;
  margin: 10px 0 8px;
}

.sprite {
  font-size: 56px;
  animation: sprite-bounce 2s ease-in-out infinite;
  display: inline-block;
}

@keyframes sprite-bounce {
  0%, 100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

.hint {
  font-size: 18px;
  color: #1b5e20;
  font-weight: 700;
  margin-top: 4px;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
}

.progress-tag {
  display: inline-block;
  margin-top: 6px;
  background: #fff;
  color: #558b2f;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 0 #689f38;
}

/* ===== 游戏区域 ===== */
.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 4;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  padding: 16px;
}

.puzzle-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  padding: 24px 32px;
  border-radius: 24px;
  border: 4px solid #66bb6a;
  box-shadow: 0 6px 0 #43a047, 0 10px 20px rgba(0, 0, 0, 0.12);
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.char-part {
  font-size: clamp(40px, 8vw, 60px);
  font-weight: 900;
  color: #2e7d32;
  background: #f1f8e9;
  border: 3px dashed #81c784;
  border-radius: 16px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plus, .equals {
  font-size: 36px;
  font-weight: 900;
  color: #ef6c00;
}

.question {
  font-size: 60px;
  font-weight: 900;
  color: #e53935;
  animation: question-pulse 1s ease-in-out infinite;
}

@keyframes question-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* ===== 偏旁连连看展示 ===== */
.radical-display {
  background: #fff;
  padding: 20px 32px;
  border-radius: 24px;
  border: 4px solid #66bb6a;
  box-shadow: 0 6px 0 #43a047, 0 10px 20px rgba(0, 0, 0, 0.12);
  margin-bottom: 16px;
  text-align: center;
}

.radical-label {
  font-size: 16px;
  color: #558b2f;
  font-weight: 700;
  margin-bottom: 10px;
}

.radical-box {
  display: inline-block;
  font-size: clamp(44px, 9vw, 64px);
  font-weight: 900;
  color: #e65100;
  background: #fff3e0;
  border: 4px dashed #ff9800;
  border-radius: 18px;
  width: 96px;
  height: 96px;
  line-height: 88px;
  animation: radical-pulse 1.2s ease-in-out infinite;
}

@keyframes radical-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

.puzzle-hint {
  font-size: 16px;
  color: #fff;
  background: rgba(46, 125, 50, 0.7);
  padding: 6px 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  font-weight: 600;
}

/* ===== 选项按钮 ===== */
.options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 20px;
}

.option-btn {
  width: 90px;
  height: 90px;
  border-radius: 20px;
  background: #fff;
  border: 4px solid #81c784;
  font-size: 44px;
  font-weight: 900;
  color: #2e7d32;
  box-shadow: 0 6px 0 #43a047;
  transition: all 0.15s ease;
}

.option-btn:not(:disabled):hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 0 #43a047;
}

.option-btn:not(:disabled):active {
  transform: translateY(3px);
  box-shadow: 0 3px 0 #43a047;
}

.option-btn.correct {
  background: #c8e6c9;
  border-color: #43a047;
  color: #1b5e20;
  box-shadow: 0 6px 0 #2e7d32;
  animation: correct-shake 0.5s ease;
}

.option-btn.wrong {
  background: #ffcdd2;
  border-color: #e53935;
  color: #b71c1c;
  box-shadow: 0 6px 0 #c62828;
  animation: wrong-shake 0.4s ease;
}

.option-btn.selected {
  background: #fff9c4;
}

@keyframes correct-shake {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes wrong-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

/* ===== 反馈区 ===== */
.feedback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.feedback-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px 36px;
  text-align: center;
  border: 4px solid;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.1);
}

.feedback-card.correct {
  border-color: #43a047;
}

.feedback-card.wrong {
  border-color: #ef6c00;
}

.feedback-icon {
  font-size: 48px;
}

.feedback-text {
  font-size: 26px;
  font-weight: 900;
  margin-top: 4px;
}

.feedback-card.correct .feedback-text {
  color: #2e7d32;
}

.feedback-card.wrong .feedback-text {
  color: #e65100;
}

.feedback-sub {
  font-size: 16px;
  color: #555;
  margin-top: 4px;
  font-weight: 600;
}

.next-btn {
  background: #ff9800;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  padding: 14px 40px;
  border-radius: 30px;
  box-shadow: 0 6px 0 #ef6c00;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #ef6c00;
}

.next-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #ef6c00;
}

/* ===== 反馈弹出动画 ===== */
.pop-enter-active,
.pop-leave-active {
  transition: all 0.3s ease;
}

.pop-enter-from {
  transform: scale(0.5);
  opacity: 0;
}

.pop-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>

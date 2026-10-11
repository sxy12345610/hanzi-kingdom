<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProgress } from '../stores/progress'
import { idiomPuzzles, shuffleArray } from '../data/idioms'

const router = useRouter()
const { state, addStars, recordGame } = useProgress()

const gameMode = ref('play') // 'play' | 'story'
const puzzles = ref([])
const currentIndex = ref(0)
const currentOptions = ref([])
const wrongOptions = ref([])
const isCorrect = ref(false)
const showFeedback = ref(false)
const showStory = ref(false)

/* ===== 听故事学成语：题库（故事分段 + 答案 + 选项） ===== */
const idiomStories = [
  {
    title: '等待兔子的农夫',
    segments: [
      '从前有一个农夫。',
      '一天，他看到一只兔子撞到了树桩。',
      '他捡到了兔子。',
      '之后每天守在树桩旁等待兔子。',
    ],
    answer: '守株待兔',
    options: ['守株待兔', '画蛇添足', '掩耳盗铃'],
  },
  {
    title: '听不见铃声的人',
    segments: [
      '一个人想偷铃铛。',
      '他捂住自己的耳朵。',
      '以为自己听不到，别人也听不到。',
    ],
    answer: '掩耳盗铃',
    options: ['掩耳盗铃', '亡羊补牢', '狐假虎威'],
  },
  {
    title: '修补羊圈',
    segments: [
      '牧羊人丢了一只羊。',
      '后来修好了羊圈。',
      '之后没有再丢羊。',
    ],
    answer: '亡羊补牢',
    options: ['亡羊补牢', '刻舟求剑', '井底之蛙'],
  },
]

/* ===== 故事模式状态 ===== */
const stories = ref([]) // 打乱后的故事顺序
const storyIndex = ref(0)
const segmentIndex = ref(0) // 当前读到第几段
const storyPhase = ref('reading') // 'reading' | 'quiz'
const storyOptions = ref([]) // 打乱后的选项
const storyWrong = ref([]) // 已选错的选项
const storyCorrect = ref(false)
const storyFeedback = ref(false)

const currentStory = computed(() => stories.value[storyIndex.value])

/* ===== 语音朗读（Web Speech API，无第三方依赖） ===== */
const supportsSpeech = 'speechSynthesis' in window // 浏览器是否支持
const speechRate = ref(1) // 语速：0.7 慢速 / 1 正常 / 1.3 快速
const speaking = ref(false) // 正在朗读
const paused = ref(false) // 已暂停
const storyDone = ref(false) // 本次故事已听完
let speechToken = 0 // 防止取消旧朗读时误触发 onend

// 尽量挑选中文语音
function pickVoice() {
  const voices = window.speechSynthesis.getVoices()
  return voices.find((v) => v.lang && v.lang.startsWith('zh')) || null
}

function stopSpeech() {
  if (!supportsSpeech) return
  speechToken += 1 // 使旧 utterance 的 onend 失效
  window.speechSynthesis.cancel()
  speaking.value = false
  paused.value = false
}

/* ===== 开始听故事：朗读标题 + 全部段落 ===== */
function speakStory() {
  if (!supportsSpeech || !currentStory.value) return
  stopSpeech()
  const token = speechToken
  const text = currentStory.value.title + '。' + currentStory.value.segments.join('')
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  u.rate = speechRate.value
  const voice = pickVoice()
  if (voice) u.voice = voice
  u.onend = () => {
    if (token !== speechToken) return // 已被取消或替换
    speaking.value = false
    paused.value = false
    storyDone.value = true // 显示“故事听完啦”
  }
  u.onerror = () => {
    if (token !== speechToken) return
    speaking.value = false
    paused.value = false
  }
  storyDone.value = false
  speaking.value = true
  paused.value = false
  window.speechSynthesis.speak(u)
}

function pauseSpeech() {
  if (!speaking.value || paused.value) return
  window.speechSynthesis.pause()
  paused.value = true
}

function resumeSpeech() {
  if (!speaking.value || !paused.value) return
  window.speechSynthesis.resume()
  paused.value = false
}

/* ===== 切换语速；若正在朗读则用新语速重新开始 ===== */
function setRate(rate) {
  speechRate.value = rate
  if (speaking.value) {
    speakStory()
  }
}

const current = computed(() => puzzles.value[currentIndex.value])

const progressText = computed(() => {
  return `${currentIndex.value + 1} / ${puzzles.value.length}`
})

function loadPuzzles() {
  puzzles.value = shuffleArray(idiomPuzzles).slice(0, 8)
}

function shuffleCurrentOptions() {
  if (current.value) {
    currentOptions.value = shuffleArray(current.value.options)
  }
}

function startGame() {
  loadPuzzles()
  currentIndex.value = 0
  shuffleCurrentOptions()
  wrongOptions.value = []
  isCorrect.value = false
  showFeedback.value = false
  showStory.value = false
}

/* ===== 故事模式：初始化 ===== */
function startStoryMode() {
  stopSpeech() // 切换故事时停止朗读
  storyDone.value = false
  stories.value = shuffleArray(idiomStories)
  storyIndex.value = 0
  segmentIndex.value = 0
  storyPhase.value = 'reading'
  storyWrong.value = []
  storyCorrect.value = false
  storyFeedback.value = false
  if (currentStory.value) {
    storyOptions.value = shuffleArray(currentStory.value.options)
  }
}

/* ===== 故事模式：下一段 ===== */
function nextSegment() {
  if (!currentStory.value) return
  if (segmentIndex.value < currentStory.value.segments.length - 1) {
    segmentIndex.value += 1
  } else {
    storyPhase.value = 'quiz'
  }
}

/* ===== 故事模式：选择答案 ===== */
function chooseStory(opt) {
  if (storyCorrect.value) return
  if (storyWrong.value.includes(opt)) return
  if (opt === currentStory.value.answer) {
    storyCorrect.value = true
    storyFeedback.value = true
    addStars(1)
    // 成语星 +1，写入 sessionStorage 供成长页读取
    sessionStorage.setItem('idiomStars', String(Number(sessionStorage.getItem('idiomStars') || 0) + 1))
    window.dispatchEvent(new Event('starUpdate')) // 通知成长页实时更新
    recordGame('idiom-story', { correct: true })
  } else {
    storyWrong.value.push(opt)
    storyFeedback.value = true
    setTimeout(() => {
      if (!storyCorrect.value) {
        storyFeedback.value = false
      }
    }, 1200)
  }
}

/* ===== 故事模式：下一题 ===== */
function nextStory() {
  stopSpeech()
  storyDone.value = false
  if (storyIndex.value < stories.value.length - 1) {
    storyIndex.value += 1
    segmentIndex.value = 0
    storyPhase.value = 'reading'
    storyWrong.value = []
    storyCorrect.value = false
    storyFeedback.value = false
    storyOptions.value = shuffleArray(currentStory.value.options)
  } else {
    startStoryMode()
  }
}

function switchMode(mode) {
  stopSpeech() // 切换模式时停止朗读
  storyDone.value = false
  gameMode.value = mode
  if (mode === 'play') {
    startGame()
  } else if (mode === 'story') {
    startStoryMode()
  }
}

function choose(opt) {
  if (isCorrect.value) return
  if (wrongOptions.value.includes(opt)) return

  if (opt === current.value.answer) {
    isCorrect.value = true
    showFeedback.value = true
    addStars(1)
    // 成语星 +1，写入 sessionStorage 供成长页读取
    sessionStorage.setItem('idiomStars', String(Number(sessionStorage.getItem('idiomStars') || 0) + 1))
    window.dispatchEvent(new Event('starUpdate')) // 通知成长页实时更新
    recordGame('idiom-picture', { correct: true })
  } else {
    wrongOptions.value.push(opt)
    showFeedback.value = true
    setTimeout(() => {
      if (!isCorrect.value) {
        showFeedback.value = false
      }
    }, 1200)
  }
}

function nextQuestion() {
  if (currentIndex.value < puzzles.value.length - 1) {
    currentIndex.value += 1
    shuffleCurrentOptions()
    wrongOptions.value = []
    isCorrect.value = false
    showFeedback.value = false
    showStory.value = false
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

// 离开页面时停止朗读
onBeforeUnmount(() => {
  stopSpeech()
})
</script>

<template>
  <div class="idiom-page">
    <!-- 漂浮气泡 -->
    <div class="bubble bubble-1">💭</div>
    <div class="bubble bubble-2">✨</div>
    <div class="bubble bubble-3">💡</div>

    <!-- 顶部栏 -->
    <header class="top-bar">
      <button class="back-btn" @click="goHome">🏠</button>
      <h1 class="title">🏝 成语故事岛</h1>
      <div class="star-box">
        <span class="star">⭐</span>
        <span class="star-count">{{ state.stars }}</span>
      </div>
    </header>

    <!-- 模式切换 -->
    <nav class="mode-switch">
      <button
        class="mode-btn"
        :class="{ active: gameMode === 'play' }"
        @click="switchMode('play')"
      >
        🎨 情境识成语
      </button>
      <button
        class="mode-btn"
        :class="{ active: gameMode === 'story' }"
        @click="switchMode('story')"
      >
        📖 听故事学成语
      </button>
    </nav>

    <!-- 猜成语模式 -->
    <template v-if="gameMode === 'play'">
      <!-- 精灵区域 -->
      <section class="sprite-area">
        <div class="sprite">🦉</div>
        <p class="hint">小朋友，看看图片，猜猜是哪个成语吧！</p>
        <div class="progress-tag">第 {{ progressText }} 题</div>
      </section>

      <!-- 游戏区域 -->
      <main class="game-area" v-if="current">
        <!-- 图片展示区 -->
        <div class="picture-display">
          <div class="emoji-row">
            <span
              v-for="(emoji, idx) in current.emoji"
              :key="idx"
              class="emoji-item"
              :style="{ animationDelay: idx * 0.15 + 's' }"
            >
              {{ emoji }}
            </span>
          </div>
        </div>

        <!-- 情境提示 -->
        <p class="puzzle-hint">💡 {{ current.hint }}</p>

        <!-- 选项按钮 -->
        <div class="options">
          <button
            v-for="opt in currentOptions"
            :key="opt"
            class="option-btn"
            :class="{
              correct: isCorrect && opt === current.answer,
              disabled: wrongOptions.includes(opt),
            }"
            :disabled="isCorrect || wrongOptions.includes(opt)"
            @click="choose(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <!-- 反馈区 -->
        <div class="feedback" v-if="showFeedback">
          <transition name="pop" mode="out-in">
            <div
              v-if="isCorrect"
              key="ok"
              class="feedback-card correct"
            >
              <div class="feedback-icon">🎉</div>
              <div class="feedback-text">太棒啦！</div>
              <div class="feedback-sub">+1 ⭐ 成语星</div>
            </div>
            <div
              v-else
              key="retry"
              class="feedback-card retry"
            >
              <div class="feedback-icon">🤔</div>
              <div class="feedback-text">再想想哦~</div>
              <div class="feedback-sub">别急，从其他选项里再挑一个！</div>
            </div>
          </transition>
        </div>

        <!-- 答对后的操作 -->
        <div class="actions" v-if="isCorrect">
          <button class="story-btn" @click="showStory = !showStory">
            {{ showStory ? '收起故事' : '📖 听故事' }}
          </button>
          <button class="next-btn" @click="nextQuestion">
            {{ currentIndex < puzzles.length - 1 ? '下一题 →' : '重新开始 🔄' }}
          </button>
        </div>

        <!-- 故事展示区（答对后可展开） -->
        <transition name="slide">
          <div class="story-box" v-if="showStory && current.story">
            <div class="story-title">📖 {{ current.answer }} 的故事</div>
            <p class="story-text">{{ current.story }}</p>
          </div>
        </transition>
      </main>
    </template>

    <!-- 听故事模式 -->
    <template v-else>
      <!-- 精灵区域 -->
      <section class="sprite-area">
        <div class="sprite">📚</div>
        <p class="hint">听故事，猜成语，看看你能答对几个！</p>
        <div class="progress-tag">第 {{ storyIndex + 1 }} / {{ stories.length }} 题</div>
      </section>

      <!-- 故事区域 -->
      <main class="game-area" v-if="currentStory">
        <!-- 故事卡片 -->
        <div class="story-card">
          <div class="story-card-title">📖 {{ currentStory.title }}</div>

          <!-- 分段显示：当前段及之前的所有段落 -->
          <div class="story-segments">
            <p
              v-for="(seg, idx) in currentStory.segments.slice(0, segmentIndex + 1)"
              :key="idx"
              class="story-seg"
              :class="{ current: idx === segmentIndex }"
            >
              {{ seg }}
            </p>
          </div>

          <!-- 阅读进度 -->
          <div class="story-progress">
            <span
              v-for="(_, idx) in currentStory.segments"
              :key="idx"
              class="progress-dot"
              :class="{ active: idx <= segmentIndex }"
            ></span>
          </div>
        </div>

        <!-- 语音朗读控制 -->
        <div class="voice-panel" v-if="supportsSpeech">
          <button v-if="!speaking" class="voice-btn" @click="speakStory">
            🔊 开始听故事
          </button>
          <button v-else-if="!paused" class="voice-btn" @click="pauseSpeech">
            ⏸ 暂停播放
          </button>
          <button v-else class="voice-btn" @click="resumeSpeech">
            ▶ 继续播放
          </button>

          <!-- 语速选择 -->
          <div class="rate-group">
            <button
              v-for="r in [
                { value: 0.7, label: '慢速' },
                { value: 1, label: '正常' },
                { value: 1.3, label: '快速' },
              ]"
              :key="r.value"
              class="rate-btn"
              :class="{ active: speechRate === r.value }"
              @click="setRate(r.value)"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <!-- 故事听完提示 -->
        <p v-if="storyDone && !speaking" class="listen-done">🎉 故事听完啦！</p>

        <!-- 下一段按钮（阅读阶段） -->
        <button
          v-if="storyPhase === 'reading'"
          class="next-btn"
          @click="nextSegment"
        >
          {{ segmentIndex < currentStory.segments.length - 1 ? '下一段 →' : '开始答题 🎯' }}
        </button>

        <!-- 答题阶段 -->
        <template v-else>
          <p class="quiz-question">这个故事对应哪个成语？</p>

          <div class="options">
            <button
              v-for="opt in storyOptions"
              :key="opt"
              class="option-btn"
              :class="{
                correct: storyCorrect && opt === currentStory.answer,
                disabled: storyWrong.includes(opt),
              }"
              :disabled="storyCorrect || storyWrong.includes(opt)"
              @click="chooseStory(opt)"
            >
              {{ opt }}
            </button>
          </div>

          <!-- 反馈区 -->
          <div class="feedback" v-if="storyFeedback">
            <transition name="pop" mode="out-in">
              <div
                v-if="storyCorrect"
                key="ok"
                class="feedback-card correct"
              >
                <div class="feedback-icon">🎉</div>
                <div class="feedback-text">太棒啦！</div>
                <div class="feedback-sub">+1 ⭐ 成语星</div>
              </div>
              <div
                v-else
                key="retry"
                class="feedback-card retry"
              >
                <div class="feedback-icon">🤔</div>
                <div class="feedback-text">再想想哦~</div>
                <div class="feedback-sub">回想一下故事里发生了什么！</div>
              </div>
            </transition>
          </div>

          <!-- 答对后的操作 -->
          <div class="actions" v-if="storyCorrect">
            <button class="next-btn" @click="nextStory">
              {{ storyIndex < stories.length - 1 ? '下一题 →' : '重新开始 🔄' }}
            </button>
          </div>
        </template>
      </main>
    </template>
  </div>
</template>

<style scoped>
.idiom-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #ffe0b2 0%, #ffb74d 50%, #f57c00 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

/* ===== 漂浮气泡 ===== */
.bubble {
  position: absolute;
  font-size: 36px;
  opacity: 0.7;
  animation: bubble-float linear infinite;
  pointer-events: none;
  z-index: 1;
}

.bubble-1 {
  bottom: -5%;
  left: 15%;
  animation-duration: 12s;
}

.bubble-2 {
  bottom: -5%;
  left: 55%;
  font-size: 30px;
  animation-duration: 15s;
  animation-delay: -4s;
}

.bubble-3 {
  bottom: -5%;
  left: 80%;
  animation-duration: 14s;
  animation-delay: -8s;
}

@keyframes bubble-float {
  0% {
    transform: translateY(20px) rotate(0deg);
  }
  100% {
    transform: translateY(-105vh) rotate(360deg);
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
  box-shadow: 0 4px 0 #e65100, 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.back-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #e65100;
}

.title {
  font-size: clamp(22px, 5vw, 34px);
  font-weight: 900;
  color: #e65100;
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
  color: #e65100;
  font-size: 15px;
  font-weight: 800;
  padding: 10px 18px;
  border-radius: 30px;
  border: 3px solid #ffcc80;
  box-shadow: 0 4px 0 #ffa726;
  transition: all 0.15s ease;
}

.mode-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #ffa726;
}

.mode-btn.active {
  background: #ff6f00;
  color: #fff;
  border-color: #e65100;
  box-shadow: 0 4px 0 #bf360c;
}

.mode-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #ffa726;
}

.mode-btn.active:active {
  box-shadow: 0 2px 0 #bf360c;
}

/* ===== 精灵区域 ===== */
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
  font-size: 17px;
  color: #bf360c;
  font-weight: 700;
  margin-top: 4px;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.5);
}

.progress-tag {
  display: inline-block;
  margin-top: 6px;
  background: #fff;
  color: #e65100;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 0 #e65100;
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

/* ===== 图片展示区 ===== */
.picture-display {
  background: #fff;
  padding: 28px 32px;
  border-radius: 24px;
  border: 4px solid #ffb74d;
  box-shadow: 0 6px 0 #f57c00, 0 10px 20px rgba(0, 0, 0, 0.12);
  margin-bottom: 16px;
  min-width: 260px;
}

.emoji-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.emoji-item {
  font-size: clamp(44px, 9vw, 64px);
  display: inline-block;
  animation: emoji-pop 0.5s ease both;
}

@keyframes emoji-pop {
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.puzzle-hint {
  font-size: 16px;
  color: #fff;
  background: rgba(191, 54, 12, 0.7);
  padding: 8px 18px;
  border-radius: 16px;
  margin-bottom: 16px;
  font-weight: 600;
  text-align: center;
  max-width: 90%;
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
  min-width: 120px;
  padding: 0 20px;
  height: 72px;
  border-radius: 20px;
  background: #fff;
  border: 4px solid #ffb74d;
  font-size: 26px;
  font-weight: 900;
  color: #e65100;
  box-shadow: 0 6px 0 #f57c00;
  transition: all 0.15s ease;
}

.option-btn:not(:disabled):hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 0 #f57c00;
}

.option-btn:not(:disabled):active {
  transform: translateY(3px);
  box-shadow: 0 3px 0 #f57c00;
}

.option-btn.correct {
  background: #c8e6c9;
  border-color: #43a047;
  color: #1b5e20;
  box-shadow: 0 6px 0 #2e7d32;
  animation: correct-shake 0.5s ease;
}

.option-btn.disabled {
  background: #eeeeee;
  border-color: #bdbdbd;
  color: #9e9e9e;
  box-shadow: 0 6px 0 #9e9e9e;
  opacity: 0.6;
}

@keyframes correct-shake {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
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
  padding: 18px 32px;
  text-align: center;
  border: 4px solid;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.1);
}

.feedback-card.correct {
  border-color: #43a047;
}

.feedback-card.retry {
  border-color: #ffb74d;
}

.feedback-icon {
  font-size: 44px;
}

.feedback-text {
  font-size: 24px;
  font-weight: 900;
  margin-top: 4px;
}

.feedback-card.correct .feedback-text {
  color: #2e7d32;
}

.feedback-card.retry .feedback-text {
  color: #ef6c00;
}

.feedback-sub {
  font-size: 15px;
  color: #666;
  margin-top: 4px;
  font-weight: 600;
}

/* ===== 操作按钮区 ===== */
.actions {
  display: flex;
  gap: 14px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.story-btn {
  background: #42a5f5;
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  padding: 12px 24px;
  border-radius: 30px;
  box-shadow: 0 6px 0 #1565c0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.story-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #1565c0;
}

.story-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #1565c0;
}

.next-btn {
  background: #ff9800;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  padding: 12px 32px;
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

/* ===== 故事展示区 ===== */
.story-box {
  margin-top: 16px;
  background: #fffde7;
  border: 3px dashed #fbc02d;
  border-radius: 20px;
  padding: 18px 22px;
  max-width: 560px;
  width: 90%;
}

.story-title {
  font-size: 18px;
  font-weight: 900;
  color: #f57f17;
  margin-bottom: 8px;
}

.story-text {
  font-size: 15px;
  line-height: 1.8;
  color: #5d4037;
  font-weight: 500;
}

/* ===== 故事卡片 ===== */
.story-card {
  background: #fff;
  padding: 22px 26px;
  border-radius: 24px;
  border: 4px solid #ffb74d;
  box-shadow: 0 6px 0 #f57c00, 0 10px 20px rgba(0, 0, 0, 0.12);
  margin-bottom: 16px;
  max-width: 560px;
  width: 100%;
}

.story-card-title {
  font-size: clamp(20px, 4.5vw, 26px);
  font-weight: 900;
  color: #e65100;
  text-align: center;
  margin-bottom: 12px;
}

.story-segments {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}

.story-seg {
  font-size: clamp(16px, 3.6vw, 20px);
  line-height: 1.7;
  color: #5d4037;
  font-weight: 600;
}

/* 当前读到的一段：高亮 + 弹入动画 */
.story-seg.current {
  color: #e65100;
  background: #fff3e0;
  border-radius: 12px;
  padding: 4px 10px;
  animation: seg-pop 0.4s ease;
}

@keyframes seg-pop {
  0% {
    transform: scale(0.9) translateY(8px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* ===== 阅读进度点 ===== */
.story-progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffe0b2;
  transition: background 0.2s ease, transform 0.2s ease;
}

.progress-dot.active {
  background: #ff9800;
  transform: scale(1.2);
}

/* ===== 答题提问 ===== */
.quiz-question {
  font-size: clamp(18px, 4vw, 22px);
  font-weight: 900;
  color: #fff;
  background: rgba(191, 54, 12, 0.7);
  padding: 10px 22px;
  border-radius: 18px;
  margin-bottom: 16px;
  text-align: center;
}

/* ===== 语音朗读控制 ===== */
.voice-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.voice-btn {
  background: #42a5f5;
  color: #fff;
  font-size: 19px;
  font-weight: 800;
  padding: 12px 30px;
  border-radius: 30px;
  box-shadow: 0 6px 0 #1565c0;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.voice-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #1565c0;
}

.voice-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #1565c0;
}

/* 语速选择 */
.rate-group {
  display: flex;
  gap: 10px;
}

.rate-btn {
  background: #fff;
  color: #e65100;
  font-size: 14px;
  font-weight: 800;
  padding: 8px 18px;
  border-radius: 24px;
  border: 3px solid #ffcc80;
  box-shadow: 0 3px 0 #ffa726;
  transition: all 0.15s ease;
}

.rate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 #ffa726;
}

.rate-btn.active {
  background: #ff6f00;
  color: #fff;
  border-color: #e65100;
  box-shadow: 0 3px 0 #bf360c;
}

.rate-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #ffa726;
}

/* 故事听完提示 */
.listen-done {
  font-size: 20px;
  font-weight: 900;
  color: #1b5e20;
  background: #c8e6c9;
  border: 3px solid #43a047;
  border-radius: 20px;
  padding: 10px 24px;
  margin-bottom: 16px;
  box-shadow: 0 4px 0 #2e7d32;
  animation: seg-pop 0.4s ease;
}

/* ===== 动画 ===== */
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

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

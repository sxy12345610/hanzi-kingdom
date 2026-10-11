<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/* ===== 古诗题库：level 为难度等级（1 简单 ~ 3 稍难） ===== */
const poemList = [
  { title: '静夜思', author: '李白', level: 1, lines: ['床前明月光', '疑是地上霜'] },
  { title: '春晓', author: '孟浩然', level: 1, lines: ['春眠不觉晓', '处处闻啼鸟'] },
  { title: '咏鹅', author: '骆宾王', level: 1, lines: ['鹅鹅鹅', '曲项向天歌'] },
  { title: '悯农', author: '李绅', level: 2, lines: ['锄禾日当午', '汗滴禾下土'] },
  { title: '小池', author: '杨万里', level: 2, lines: ['泉眼无声惜细流', '树阴照水爱晴柔'] },
  { title: '山行', author: '杜牧', level: 3, lines: ['远上寒山石径斜', '白云生处有人家'] },
]

/* ===== 诗词星：sessionStorage 保存（关闭标签页后清零） ===== */
const poemStars = ref(Number(sessionStorage.getItem('poemStars') || 0))

function saveStars() {
  sessionStorage.setItem('poemStars', String(poemStars.value))
  window.dispatchEvent(new Event('starUpdate')) // 通知成长页实时更新
}

/* ===== 游戏状态 ===== */
const currentIndex = ref(0)
const pool = ref([]) // 打乱后的诗句卡片池
const answer = ref([]) // 排序区（学生已排好的诗句）
const status = ref('playing') // 'playing' | 'correct' | 'wrong'

const current = computed(() => poemList[currentIndex.value])

const progressText = computed(() => `${currentIndex.value + 1} / ${poemList.length}`)

// 是否已放完全部诗句（可以点“完成”了）
const isFull = computed(() => answer.value.length === current.value.lines.length)

/* ===== 工具：随机打乱数组；若与正确顺序一致则再打乱一次 ===== */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  // 避免一进来就是正确顺序
  if (a.length > 1 && a.every((v, i) => v === arr[i])) {
    return shuffle(arr)
  }
  return a
}

/* ===== 开始/重置当前题目：随机打乱诗句 ===== */
function startPoem() {
  pool.value = shuffle(current.value.lines)
  answer.value = []
  status.value = 'playing'
}

/* ===== 点击卡片池中的诗句 -> 加入排序区 ===== */
function pick(line) {
  if (status.value === 'correct') return
  pool.value = pool.value.filter((l) => l !== line)
  answer.value.push(line)
  if (status.value === 'wrong') status.value = 'playing' // 重新调整时清除失败提示
}

/* ===== 点击排序区中的诗句 -> 放回卡片池 ===== */
function unpick(line) {
  if (status.value === 'correct') return
  answer.value = answer.value.filter((l) => l !== line)
  pool.value.push(line)
  if (status.value === 'wrong') status.value = 'playing'
}

/* ===== 点击“完成”：判断顺序 ===== */
function checkAnswer() {
  if (!isFull.value || status.value === 'correct') return
  const ok = answer.value.every((line, i) => line === current.value.lines[i])
  status.value = ok ? 'correct' : 'wrong'
  if (ok) {
    poemStars.value += 1
    saveStars()
  }
}

/* ===== 下一题：切换古诗并重新随机打乱 ===== */
function nextPoem() {
  currentIndex.value = (currentIndex.value + 1) % poemList.length
  startPoem()
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  // 每次进入页面随机选一首开始
  currentIndex.value = Math.floor(Math.random() * poemList.length)
  startPoem()
})
</script>

<template>
  <div class="poem-page">
    <!-- 漂浮装饰：星星与月亮 -->
    <div class="star-deco star-deco-1">⭐</div>
    <div class="star-deco star-deco-2">✨</div>
    <div class="star-deco star-deco-3">🌟</div>
    <div class="star-deco star-deco-4">✨</div>

    <!-- 顶部栏 -->
    <header class="top-bar">
      <button class="back-btn" @click="goHome">🏠</button>
      <h1 class="title">🌙 古诗村</h1>
      <div class="star-box">
        <span class="star">⭐</span>
        <span class="star-count">{{ poemStars }}</span>
      </div>
    </header>

    <!-- 副标题 -->
    <p class="subtitle">小诗童，帮我找回丢失的诗句吧！</p>

    <!-- 古诗卷轴区域 -->
    <section class="scroll-area" v-if="current">
      <div class="scroll-rod top"></div>
      <div class="scroll-body">
        <div class="scroll-icon">📜</div>
        <div class="poem-name">《{{ current.title }}》</div>
        <div class="poem-author">{{ current.author }}</div>
        <div class="progress-tag">第 {{ progressText }} 首</div>
      </div>
      <div class="scroll-rod bottom"></div>
    </section>

    <!-- 排序区：学生排好的诗句 -->
    <section class="answer-area">
      <div
        v-for="(line, i) in current.lines"
        :key="i"
        class="answer-slot"
        :class="{ filled: answer[i] }"
      >
        <button v-if="answer[i]" class="line-card in-answer" @click="unpick(answer[i])">
          {{ answer[i] }}
        </button>
        <span v-else class="slot-placeholder">{{ i + 1 }}</span>
      </div>
    </section>

    <!-- 打乱后的诗句卡片池 -->
    <section class="pool-area">
      <button
        v-for="line in pool"
        :key="line"
        class="line-card"
        @click="pick(line)"
      >
        {{ line }}
      </button>
      <p v-if="pool.length === 0 && status === 'playing'" class="pool-empty">
        都放好啦，点「完成」检查一下吧！
      </p>
    </section>

    <!-- 完成按钮 -->
    <button
      v-if="status !== 'correct'"
      class="done-btn"
      :disabled="!isFull"
      @click="checkAnswer"
    >
      ✅ 完成
    </button>

    <!-- 反馈区 -->
    <transition name="pop" mode="out-in">
      <div v-if="status === 'correct'" key="ok" class="feedback-card correct">
        <div class="feedback-icon">🎉</div>
        <div class="feedback-text">太棒啦！</div>
        <div class="feedback-sub">你完成了一首古诗！</div>
        <div class="feedback-reward">+1 ⭐ 诗词星</div>
        <button class="next-btn" @click="nextPoem">下一首 →</button>
      </div>
      <div v-else-if="status === 'wrong'" key="no" class="feedback-card wrong">
        <div class="feedback-icon">🌱</div>
        <div class="feedback-text">再想一想诗人的表达顺序。</div>
        <div class="feedback-sub">点诗句卡片可以拿回来重新排哦</div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.poem-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #d1c4e9 0%, #b39ddb 45%, #7e57c2 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 40px;
}

/* ===== 漂浮星星装饰 ===== */
.star-deco {
  position: absolute;
  font-size: 34px;
  opacity: 0.8;
  animation: twinkle 2.6s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

.star-deco-1 {
  top: 10%;
  left: 8%;
}

.star-deco-2 {
  top: 22%;
  right: 10%;
  font-size: 26px;
  animation-delay: -0.8s;
}

.star-deco-3 {
  top: 48%;
  left: 5%;
  font-size: 28px;
  animation-delay: -1.6s;
}

.star-deco-4 {
  top: 62%;
  right: 7%;
  animation-delay: -2.1s;
}

@keyframes twinkle {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.25) rotate(12deg);
    opacity: 0.5;
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
}

.back-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #fff;
  font-size: 26px;
  box-shadow: 0 4px 0 #7b1fa2, 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease;
}

.back-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #7b1fa2;
}

.title {
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 900;
  color: #6a1b9a;
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

/* ===== 副标题 ===== */
.subtitle {
  z-index: 3;
  margin-top: 10px;
  font-size: clamp(15px, 2.4vw, 19px);
  font-weight: 700;
  color: #4a148c;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.6);
}

/* ===== 古诗卷轴 ===== */
.scroll-area {
  z-index: 3;
  margin-top: 14px;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scroll-rod {
  width: 104%;
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(180deg, #a1887f 0%, #6d4c41 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  z-index: 2;
}

.scroll-body {
  width: 96%;
  background: linear-gradient(180deg, #fff8e1 0%, #ffecb3 100%);
  border-left: 4px solid #d7ccc8;
  border-right: 4px solid #d7ccc8;
  padding: 14px 20px;
  text-align: center;
  position: relative;
}

.scroll-icon {
  font-size: 36px;
  animation: scroll-swing 3s ease-in-out infinite;
  display: inline-block;
}

@keyframes scroll-swing {
  0%, 100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
}

.poem-name {
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 900;
  color: #5d4037;
  margin-top: 2px;
}

.poem-author {
  font-size: clamp(14px, 2.4vw, 18px);
  font-weight: 700;
  color: #8d6e63;
  margin-top: 2px;
}

.progress-tag {
  display: inline-block;
  margin-top: 8px;
  background: #fff;
  color: #7b1fa2;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 0 #ce93d8;
}

/* ===== 排序区 ===== */
.answer-area {
  z-index: 3;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 460px;
}

.answer-slot {
  min-height: 64px;
  border-radius: 18px;
  border: 3px dashed rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.answer-slot.filled {
  border-style: solid;
  border-color: transparent;
  background: transparent;
}

.slot-placeholder {
  font-size: 22px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.75);
}

/* ===== 诗句卡片 ===== */
.line-card {
  font-size: clamp(20px, 4.4vw, 28px);
  font-weight: 900;
  color: #4a148c;
  background: #fff;
  border: 4px solid #ce93d8;
  border-radius: 18px;
  padding: 12px 22px;
  box-shadow: 0 5px 0 #ab47bc, 0 8px 14px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  letter-spacing: 4px;
  user-select: none;
}

.line-card:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 9px 0 #ab47bc, 0 12px 18px rgba(0, 0, 0, 0.2);
}

.line-card:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #ab47bc;
}

/* 排序区里的卡片：浅紫底，提示可点回 */
.line-card.in-answer {
  width: 100%;
  background: #f3e5f5;
  border-color: #ba68c8;
  animation: pop-in 0.25s ease;
}

@keyframes pop-in {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ===== 卡片池 ===== */
.pool-area {
  z-index: 3;
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  width: 100%;
  max-width: 460px;
  min-height: 64px;
}

.pool-empty {
  font-size: 15px;
  font-weight: 700;
  color: #f3e5f5;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
}

/* ===== 完成按钮 ===== */
.done-btn {
  z-index: 3;
  margin-top: 18px;
  background: #ff9800;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  padding: 14px 44px;
  border-radius: 30px;
  box-shadow: 0 6px 0 #ef6c00;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.done-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.done-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 #ef6c00;
}

.done-btn:not(:disabled):active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #ef6c00;
}

/* ===== 反馈卡片 ===== */
.feedback-card {
  z-index: 4;
  margin-top: 20px;
  background: #fff;
  border-radius: 24px;
  padding: 20px 36px;
  text-align: center;
  border: 4px solid;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
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
  font-size: 24px;
  font-weight: 900;
  margin-top: 4px;
  color: #2e7d32;
}

.feedback-card.wrong .feedback-text {
  font-size: 20px;
  color: #e65100;
}

.feedback-sub {
  font-size: 16px;
  color: #555;
  margin-top: 4px;
  font-weight: 600;
}

.feedback-reward {
  font-size: 18px;
  font-weight: 800;
  color: #f57f17;
  margin-top: 6px;
}

.next-btn {
  margin-top: 14px;
  background: #ff9800;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  padding: 12px 36px;
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

.pop-enter-from,
.pop-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>

const STORAGE_KEY = "knowledge-course-site-template-state";

const questionTitles = {
  q1: "第 1 题：注意力机制解决什么问题",
  q2: "第 2 题：为什么要除以 √dk",
  q3: "第 3 题：多头注意力的核心收益",
};

const defaultState = {
  favorites: [],
  wrongQuestions: [],
};

// 从本地恢复学习记录；如果 JSON 损坏，则自动回退到空状态。
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

// 统一写回本地存储，保证收藏题和错题回顾在刷新后仍可恢复。
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// 重绘页面底部的“收藏题”和“错题回顾”列表。
function renderSavedLists() {
  const favoriteList = document.getElementById("favorite-list");
  const wrongList = document.getElementById("wrong-list");

  favoriteList.innerHTML = "";
  wrongList.innerHTML = "";

  if (state.favorites.length === 0) {
    favoriteList.innerHTML = "<li>暂无收藏题</li>";
  } else {
    state.favorites.forEach((id) => {
      const li = document.createElement("li");
      li.textContent = questionTitles[id] || id;
      favoriteList.appendChild(li);
    });
  }

  if (state.wrongQuestions.length === 0) {
    wrongList.innerHTML = "<li>暂无错题</li>";
  } else {
    state.wrongQuestions.forEach((id) => {
      const li = document.createElement("li");
      li.textContent = questionTitles[id] || id;
      wrongList.appendChild(li);
    });
  }
}

// 根据滚动位置更新左侧导航高亮、当前章节名称和阅读进度。
function updateActiveSection() {
  const sections = Array.from(document.querySelectorAll(".course-section"));
  const navLinks = Array.from(document.querySelectorAll(".chapter-nav a"));
  const currentSection = document.getElementById("current-section");
  const progressText = document.getElementById("progress-text");
  const progressFill = document.getElementById("progress-fill");

  const viewportMarker = window.innerHeight * 0.25;
  let active = sections[0];

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= viewportMarker) {
      active = section;
    }
  });

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;

  currentSection.textContent = active?.dataset.title || "课程开场";
  progressText.textContent = `${Math.round(progress)}%`;
  progressFill.style.width = `${progress}%`;

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.target === active?.id);
  });
}

// 只有答错时才写入错题列表，并避免重复追加。
function recordWrongQuestion(questionId) {
  if (!state.wrongQuestions.includes(questionId)) {
    state.wrongQuestions.push(questionId);
    saveState(state);
    renderSavedLists();
  }
}

// 章节小测的判分逻辑，同时负责把错题沉淀到底部题库。
function bindQuizActions() {
  document.querySelectorAll(".grade-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const questionId = button.dataset.questionId;
      const answer = button.dataset.answer;
      const checked = document.querySelector(`input[name="${questionId}"]:checked`);
      const feedback = document.getElementById(`feedback-${questionId}`);

      if (!checked) {
        feedback.textContent = "请先选择一个答案。";
        feedback.className = "feedback wrong";
        return;
      }

      if (checked.value === answer) {
        feedback.textContent = "回答正确，已经记录你的作答。";
        feedback.className = "feedback correct";
      } else {
        feedback.textContent = "回答错误，这道题已加入错题回顾。";
        feedback.className = "feedback wrong";
        recordWrongQuestion(questionId);
      }
    });
  });
}

// 题库管理区支持手动收藏题目，作为复习入口。
function bindFavoriteActions() {
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const questionId = button.dataset.favoriteId;
      if (!state.favorites.includes(questionId)) {
        state.favorites.push(questionId);
        saveState(state);
        renderSavedLists();
      }
    });
  });
}

// 为演示模板提供“一键清空本地记录”的重置能力。
function bindClearAction() {
  const clearButton = document.getElementById("clear-storage");
  clearButton.addEventListener("click", () => {
    state = { ...defaultState };
    saveState(state);
    renderSavedLists();
  });
}

renderSavedLists();
bindQuizActions();
bindFavoriteActions();
bindClearAction();
updateActiveSection();

window.addEventListener("scroll", updateActiveSection, { passive: true });
window.addEventListener("resize", updateActiveSection);

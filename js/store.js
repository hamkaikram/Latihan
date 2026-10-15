// Penyimpanan progres di localStorage.
const Store = (() => {
  const KEY = 'latihan-progress-v1';
  const XP_PER_LESSON = 50;
  const XP_PER_LEVEL = 200;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { completed: {}, code: {} };
    } catch {
      return { completed: {}, code: {} };
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  const lessonKey = (courseId, idx) => `${courseId}/${idx}`;

  return {
    isCompleted: (courseId, idx) => !!state.completed[lessonKey(courseId, idx)],
    complete(courseId, idx) {
      state.completed[lessonKey(courseId, idx)] = Date.now();
      save();
    },
    courseProgress(course) {
      const done = course.lessons.filter((_, i) => this.isCompleted(course.id, i)).length;
      return { done, total: course.lessons.length };
    },
    getCode: (courseId, idx) => state.code[lessonKey(courseId, idx)],
    setCode(courseId, idx, files) {
      state.code[lessonKey(courseId, idx)] = files;
      save();
    },
    clearCode(courseId, idx) {
      delete state.code[lessonKey(courseId, idx)];
      save();
    },
    xp: () => Object.keys(state.completed).length * XP_PER_LESSON,
    level() { return Math.floor(this.xp() / XP_PER_LEVEL) + 1; },
    reset() { state = { completed: {}, code: {} }; save(); },
  };
})();

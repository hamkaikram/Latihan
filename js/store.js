// Penyimpanan progres di localStorage.
const Store = (() => {
  const KEY = 'latihan-progress-v1';
  const XP_PER_LESSON = 50;
  const XP_PER_LEVEL = 200;

  const empty = () => ({ completed: {}, code: {}, roadmap: {} });

  function load() {
    try {
      return { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) };
    } catch {
      return empty();
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
    isCourseDone(courseId) {
      const course = COURSES.find((c) => c.id === courseId);
      return !!course && course.lessons.every((_, i) => this.isCompleted(courseId, i));
    },
    // Item roadmap tercentang manual, atau otomatis jika kursus terkaitnya selesai.
    isRoadmapDone(item) {
      return !!state.roadmap[item.id] || (!!item.course && this.isCourseDone(item.course));
    },
    toggleRoadmap(itemId, value) {
      if (value) state.roadmap[itemId] = Date.now();
      else delete state.roadmap[itemId];
      save();
    },
    resetRoadmap() { state.roadmap = {}; save(); },
    nextLesson() {
      for (const c of COURSES) {
        const i = c.lessons.findIndex((_, i) => !this.isCompleted(c.id, i));
        if (i !== -1) return { course: c, idx: i };
      }
      return null;
    },
    xp: () => Object.keys(state.completed).length * XP_PER_LESSON,
    level() { return Math.floor(this.xp() / XP_PER_LEVEL) + 1; },
    reset() { state = empty(); save(); },
  };
})();

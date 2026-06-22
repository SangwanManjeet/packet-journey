/* =====================================================================
   COURSE REGISTRY
   The single place every course plugs into. Adding a new topic means
   creating one course file that calls App.registerCourse(...) — nothing
   here needs to change.

   A course is:
   {
     key:         unique string id (used as the "deck" key)
     section:     'network' | 'systemdesign'
     title:       human title
     beats:       [ { ch, scene, sub?, ttl, txt }, ... ]   // the story script
     scenes:      { sceneName: renderFn(sub) -> htmlString }
     chapterMeta: { 'chapter label': { icon, color, blurb } }  // network-style: a card per chapter
     card:        { icon, color, title, blurb }               // system-design-style: one card per course
   }
   ===================================================================== */
window.App = (function () {
  const courses = [];
  const byKey = {};

  function registerCourse(course) {
    if (!course || !course.key) throw new Error('registerCourse: a course needs a unique "key"');
    if (byKey[course.key]) throw new Error('registerCourse: duplicate course key "' + course.key + '"');
    courses.push(course);
    byKey[course.key] = course;
  }

  const getCourses = () => courses;
  const getCourse = (key) => byKey[key];
  const coursesInSection = (section) => courses.filter((c) => c.section === section);

  // beats keyed by course id — consumed by the engine
  function buildDecks() {
    const decks = {};
    courses.forEach((c) => { decks[c.key] = c.beats; });
    return decks;
  }

  // every scene renderer merged into one lookup — consumed by the engine
  function buildRender() {
    const render = {};
    courses.forEach((c) => Object.assign(render, c.scenes || {}));
    return render;
  }

  return { registerCourse, getCourses, getCourse, coursesInSection, buildDecks, buildRender };
})();

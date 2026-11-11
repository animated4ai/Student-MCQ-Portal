// Student MCQ Portal — app engine
// Developed by Code Brothers. Plain JS, zero dependencies, no server calls.
(function () {
  "use strict";

  var TEST_SECONDS = 300; // 5 minutes per test
  var SUBJECTS = {
    "3": ["English", "Urdu", "Maths"],
    "4": ["English", "Urdu", "Maths"],
    "5": ["English", "Urdu", "Maths"],
    "6": ["English", "Urdu", "Maths", "Science"],
    "7": ["English", "Urdu", "Maths", "Science"],
    "8": ["English", "Urdu", "Maths", "Science"]
  };
  var SUBJECT_ICON = { English: "📖", Urdu: "📝", Maths: "🔢", Science: "🔬" };
  var SUBJECT_CLASS = { English: "sub-english", Urdu: "sub-urdu", Maths: "sub-maths", Science: "sub-science" };
  var CLASS_EMOJI = { "3": "🌸", "4": "🍊", "5": "🌿", "6": "💧", "7": "🔮", "8": "🌊" };

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function sample(arr, n) { return shuffle(arr).slice(0, n); }
  function showView(name) {
    ["view-home", "view-subjects", "view-test", "view-results"].forEach(function (v) {
      $(v).classList.toggle("hidden", v !== name);
    });
    window.scrollTo(0, 0);
  }
  function bestKey(cls, subject) { return "mcq_best_" + cls + "_" + subject; }
  function getBest(cls, subject) {
    try {
      var raw = localStorage.getItem(bestKey(cls, subject));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveBest(cls, subject, score, total) {
    var prev = getBest(cls, subject);
    if (!prev || score > prev.score) {
      try { localStorage.setItem(bestKey(cls, subject), JSON.stringify({ score: score, total: total })); } catch (e) {}
    }
  }

  // ---------- state ----------
  var state = {
    student: "", school: "",
    cls: null, subject: null, mixed: false,
    questions: [], index: 0, answers: [],
    timerId: null, timeLeft: TEST_SECONDS
  };

  // ---------- home: class cards ----------
  function buildClassCards() {
    var grid = $("classGrid");
    grid.innerHTML = "";
    ["3", "4", "5", "6", "7", "8"].forEach(function (cls) {
      var n = SUBJECTS[cls].length;
      var btn = document.createElement("button");
      btn.className = "class-card class-" + cls;
      btn.innerHTML =
        '<div class="big">' + CLASS_EMOJI[cls] + '</div>' +
        '<div class="name">Class ' + cls + '</div>' +
        '<div class="meta">' + n + ' Subjects • Practice Tests</div>';
      btn.addEventListener("click", function () { openSubjects(cls); });
      grid.appendChild(btn);
    });
  }

  function readStudent() {
    state.student = $("studentName").value.trim();
    state.school = $("schoolName").value.trim();
  }

  // ---------- subjects view ----------
  function openSubjects(cls) {
    readStudent();
    state.cls = cls;
    $("subjectsTitle").textContent = "Class " + cls + " — Choose a Subject";
    var grid = $("subjectGrid");
    grid.innerHTML = "";
    SUBJECTS[cls].forEach(function (sub) {
      var best = getBest(cls, sub);
      var btn = document.createElement("button");
      btn.className = "subject-card " + SUBJECT_CLASS[sub];
      btn.innerHTML =
        '<div class="icon">' + SUBJECT_ICON[sub] + '</div>' +
        '<div class="name">' + sub + '</div>' +
        '<div class="meta">9 Questions • 9 Marks • 5 Minutes</div>' +
        (best ? '<span class="best">⭐ Best: ' + best.score + '/' + best.total + '</span>' : "");
      btn.addEventListener("click", function () { startTest(cls, sub, false); });
      grid.appendChild(btn);
    });
    // Mixed test card
    var n = cls <= "5" ? 9 : 12;
    var mixBest = getBest(cls, "mixed");
    var mix = document.createElement("button");
    mix.className = "subject-card sub-mixed";
    mix.innerHTML =
      '<div class="icon">🎲</div>' +
      '<div class="name">Mixed Test</div>' +
      '<div class="meta">' + n + ' Questions • ' + n + ' Marks • 5 Minutes</div>' +
      (mixBest ? '<span class="best">⭐ Best: ' + mixBest.score + '/' + mixBest.total + '</span>' : "");
    mix.addEventListener("click", function () { startTest(cls, "Mixed", true); });
    grid.appendChild(mix);
    showView("view-subjects");
  }

  // ---------- test engine ----------
  function buildTestQuestions(cls, subject, mixed) {
    var list = [];
    if (mixed) {
      SUBJECTS[cls].forEach(function (sub) {
        sample(QB[cls][sub], 3).forEach(function (q) {
          list.push(prepareQuestion(q, sub));
        });
      });
    } else {
      sample(QB[cls][subject], 9).forEach(function (q) {
        list.push(prepareQuestion(q, subject));
      });
    }
    return list;
  }

  // Shuffle option order, keep the correct answer mapped.
  function prepareQuestion(q, subject) {
    var opts = q.o.map(function (text, i) { return { text: text, correct: i === q.a }; });
    var shuffled = shuffle(opts);
    var answer = -1;
    shuffled.forEach(function (o, i) { if (o.correct) answer = i; });
    return { q: q.q, u: q.u || "", e: q.e || "", options: shuffled.map(function (o) { return o.text; }), answer: answer, subject: subject };
  }

  function startTest(cls, subject, mixed) {
    state.subject = subject;
    state.mixed = mixed;
    state.questions = buildTestQuestions(cls, subject, mixed);
    state.index = 0;
    state.answers = state.questions.map(function () { return -1; }); // -1 = unanswered
    $("testLabel").textContent = "Class " + cls + " • " + (mixed ? "Mixed Test" : subject);
    stopTimer();
    state.timeLeft = TEST_SECONDS;
    updateTimer();
    state.timerId = setInterval(tick, 1000);
    showView("view-test");
    renderQuestion();
  }

  function tick() {
    state.timeLeft -= 1;
    updateTimer();
    if (state.timeLeft <= 0) {
      stopTimer();
      submitTest(true);
    }
  }
  function updateTimer() {
    var m = Math.floor(state.timeLeft / 60);
    var s = state.timeLeft % 60;
    var el = $("timer");
    el.textContent = "⏱ " + m + ":" + (s < 10 ? "0" : "") + s;
    el.classList.toggle("low", state.timeLeft <= 60);
  }
  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  function renderQuestion() {
    var total = state.questions.length;
    var q = state.questions[state.index];
    var isUrdu = q.subject === "Urdu";
    $("progressText").textContent = "Question " + (state.index + 1) + " of " + total;
    $("progressBar").style.width = ((state.index + 1) / total * 100) + "%";
    var qt = $("questionText");
    qt.textContent = q.q;
    qt.setAttribute("dir", isUrdu ? "rtl" : "ltr");
    qt.setAttribute("lang", isUrdu ? "ur" : "en");
    var qu = $("questionUrdu");
    if (q.u) { qu.textContent = q.u; qu.style.display = ""; } else { qu.textContent = ""; qu.style.display = "none"; }
    var box = $("optionsBox");
    box.innerHTML = "";
    var letters = ["A", "B", "C", "D"];
    q.options.forEach(function (opt, i) {
      var btn = document.createElement("button");
      btn.className = "option" + (state.answers[state.index] === i ? " selected" : "");
      btn.setAttribute("type", "button");
      var inner = '<span class="key">' + letters[i] + '</span><span>' + escapeHtml(opt) + "</span>";
      btn.innerHTML = inner;
      if (isUrdu) { btn.setAttribute("dir", "rtl"); btn.setAttribute("lang", "ur"); }
      btn.addEventListener("click", function () {
        state.answers[state.index] = i;
        renderQuestion();
      });
      box.appendChild(btn);
    });
    $("prevBtn").disabled = state.index === 0;
    $("nextBtn").textContent = state.index === total - 1 ? "Submit ✓" : "Next →";
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function nextStep() {
    if (state.index < state.questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      submitTest(false);
    }
  }
  function prevStep() {
    if (state.index > 0) { state.index -= 1; renderQuestion(); }
  }

  function quitTest() {
    if (window.confirm("Are you sure you want to quit this test? Your answers will be lost.")) {
      stopTimer();
      showView("view-home");
    }
  }

  // ---------- results ----------
  function gradeFor(pct) {
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B";
    if (pct >= 60) return "C";
    if (pct >= 50) return "D";
    return "F";
  }

  function submitTest(auto) {
    stopTimer();
    var total = state.questions.length;
    var correct = 0;
    state.questions.forEach(function (q, i) {
      if (state.answers[i] === q.answer) correct += 1;
    });
    var wrong = total - correct;
    var pct = Math.round(correct / total * 100);
    var grade = gradeFor(pct);

    var heading, message;
    if (pct >= 90) { heading = "🎉 Excellent! You Passed the Test!"; message = "Outstanding! Perfect score! You're well prepared!"; }
    else if (pct >= 70) { heading = "👏 Well Done! You Passed the Test!"; message = "Great work! Keep practising to reach a perfect score!"; }
    else if (pct >= 50) { heading = "🙂 Good Effort — You Passed!"; message = "You passed! Review the answers below and try again for a higher grade."; }
    else { heading = "💪 Don't Give Up — Try Again!"; message = "Keep practising — review the correct answers below and take the test again!"; }
    if (auto) { message += " (Time finished — the test was submitted automatically.)"; }

    $("resultHeading").textContent = heading;
    $("scorePct").textContent = pct + "%";
    $("ringFg").style.strokeDashoffset = String(326.7 * (1 - pct / 100));
    $("ringFg").style.stroke = pct >= 50 ? "#16a34a" : "#dc2626";
    $("scoreText").textContent = correct + "/" + total;
    var who = [];
    if (state.student) who.push("Student: " + state.student);
    if (state.school) who.push("School: " + state.school);
    $("studentLine").textContent = who.join("  •  ");
    $("resultMessage").textContent = message;
    $("sumCorrect").textContent = correct;
    $("sumWrong").textContent = wrong;
    $("sumTotal").textContent = total;
    $("sumMarks").textContent = correct + "/" + total;
    $("sumGrade").textContent = grade;

    saveBest(state.cls, state.mixed ? "mixed" : state.subject, correct, total);
    renderReview();
    showView("view-results");
  }

  function renderReview() {
    var box = $("reviewBox");
    box.innerHTML = "";
    var letters = ["A", "B", "C", "D"];
    var lastSubject = null;
    state.questions.forEach(function (q, qi) {
      if (q.subject !== lastSubject) {
        lastSubject = q.subject;
        var h = document.createElement("div");
        h.className = "review-subject";
        h.textContent = (SUBJECT_ICON[q.subject] || "📖") + " " + q.subject;
        box.appendChild(h);
      }
      var div = document.createElement("div");
      div.className = "review-q";
      var html = '<div class="rq-text">Q' + (qi + 1) + '. ' + escapeHtml(q.q) + "</div>";
      if (q.u) { html += '<div class="rq-urdu" dir="rtl" lang="ur">' + escapeHtml(q.u) + "</div>"; }
      html += "<ul>";
      q.options.forEach(function (opt, i) {
        var cls = "";
        var tag = "";
        if (i === q.answer) { cls = "correct"; tag = '<span class="tag ok">(Correct Answer) ✓</span>'; }
        else if (i === state.answers[qi]) { cls = "wrong"; tag = '<span class="tag no">(Your Answer) ✗</span>'; }
        html += '<li class="' + cls + '">' + letters[i] + ". " + escapeHtml(opt) + tag + "</li>";
      });
      html += "</ul>";
      if (q.e) { html += '<div class="rq-exp">💡 ' + escapeHtml(q.e) + "</div>"; }
      div.innerHTML = html;
      box.appendChild(div);
    });
  }

  // ---------- wiring ----------
  $("backHomeBtn").addEventListener("click", function () { showView("view-home"); });
  $("prevBtn").addEventListener("click", prevStep);
  $("nextBtn").addEventListener("click", nextStep);
  $("quitBtn").addEventListener("click", quitTest);
  $("againBtn").addEventListener("click", function () { showView("view-home"); });
  $("printBtn").addEventListener("click", function () { window.print(); });

  buildClassCards();
})();

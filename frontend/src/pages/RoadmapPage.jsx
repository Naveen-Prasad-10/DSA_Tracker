import { useState, useEffect, useMemo } from "react";
import { CURRICULUM, START_DATE } from "../data/roadmapData";
import { addProblem, getRoadmapProgress, toggleRoadmapProgress, syncRoadmapProgress } from "../services/api";
import "./RoadmapPage.css";

// ── Helpers ──────────────────────────────────────────────────────────────────
const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
const leetcodeUrl = (name) => `https://leetcode.com/problems/${toSlug(name)}/`;

const STORAGE_KEY_COMPLETED = "roadmap_completed_v2";

export default function RoadmapPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [completed, setCompleted] = useState(new Set());

  const [filters, setFilters] = useState({
    week: "all",
    topic: "all",
    difficulty: "all",
    status: "all"
  });

  const [openWeeks, setOpenWeeks] = useState(new Set([1])); // Week 1 open by default

  // ── Sync with DB / Migrate from localStorage ─────────────────────────────
  useEffect(() => {
    const initData = async () => {
      const localData = localStorage.getItem(STORAGE_KEY_COMPLETED);
      if (localData) {
        try {
          const ids = JSON.parse(localData);
          if (Array.isArray(ids) && ids.length > 0) {
            await syncRoadmapProgress(ids);
          }
          localStorage.removeItem(STORAGE_KEY_COMPLETED);
        } catch (e) {
          console.error("Migration failed", e);
        }
      }
      
      try {
        const dbIds = await getRoadmapProgress();
        setCompleted(new Set(dbIds));
      } catch (e) {
        console.error("Failed to fetch roadmap progress", e);
      }
    };
    initData();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleWeek = (weekNum) => {
    setOpenWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  };

  const toggleProblem = async (id) => {
    // Optimistic UI update
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    
    try {
      await toggleRoadmapProgress(id);
    } catch (e) {
      console.error("Failed to save progress", e);
      // Revert on error
      setCompleted(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const addToReminders = async (problem, topicName) => {
    try {
      await addProblem({
        title: `#${problem.id} ${problem.name}`,
        topic: `Curriculum: ${topicName}`,
        difficulty: problem.difficulty,
        date_solved: new Date().toISOString().slice(0, 10),
        confidence: 3
      });
      alert(`"${problem.name}" added to reminders`);
    } catch (err) {
      alert("Failed to add problem");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // ── Derived Data ───────────────────────────────────────────────────────────
  const { stats, currentFocusTopic, nextScheduledProblem } = useMemo(() => {
    let total = 0;
    let done = 0;
    const weekStats = [];
    
    // Flat list of all problems to easily find "next"
    const allProblems = [];

    CURRICULUM.forEach(w => {
      let wTotal = 0;
      let wDone = 0;
      const topicStats = [];

      w.topics.forEach(t => {
        let tTotal = t.problems.length;
        let tDone = 0;

        t.problems.forEach(p => {
          const isDone = completed.has(p.id);
          if (isDone) tDone++;
          
          const scheduledDate = new Date(START_DATE);
          scheduledDate.setDate(scheduledDate.getDate() + p.dayOffset);
          
          allProblems.push({ ...p, weekNum: w.week, topicName: t.name, isDone, scheduledDate });
        });

        wTotal += tTotal;
        wDone += tDone;
        topicStats.push({ name: t.name, total: tTotal, done: tDone, pct: Math.round((tDone/tTotal)*100) });
      });

      total += wTotal;
      done += wDone;
      weekStats.push({ weekNum: w.week, total: wTotal, done: wDone, pct: Math.round((wDone/wTotal)*100), topicStats });
    });

    const pct = total ? Math.round((done/total)*100) : 0;

    // Determine current focus / next scheduled
    // Sort all problems by scheduled date
    allProblems.sort((a, b) => a.scheduledDate - b.scheduledDate);
    
    const nextProb = allProblems.find(p => !p.isDone);
    let focusTopic = null;
    if (nextProb) {
      focusTopic = weekStats.find(w => w.weekNum === nextProb.weekNum)?.topicStats.find(t => t.name === nextProb.topicName);
    }

    return { 
      stats: { total, done, pct, weekStats },
      currentFocusTopic: focusTopic ? { ...focusTopic, weekNum: nextProb.weekNum } : null,
      nextScheduledProblem: nextProb || null
    };
  }, [completed]);

  // Extract all topics for the dropdown
  const allTopics = useMemo(() => {
    const tSet = new Set();
    CURRICULUM.forEach(w => w.topics.forEach(t => tSet.add(t.name)));
    return Array.from(tSet);
  }, []);

  return (
    <div className="page-wide roadmap-page">
      {/* ── Global Header ─────────────────────────────────── */}
      <div className="roadmap-header">
        <div className="roadmap-header-content">
          <h1>4-Week Interview Curriculum</h1>
          <p className="roadmap-sub">A focused study plan for acing technical interviews.</p>
        </div>
        
        <div className="overall-stats-card">
          <div className="overall-stats-labels">
            <span>Overall Progress</span>
            <span>{stats.done} / {stats.total}</span>
          </div>
          <div className="overall-bar-wrap">
            <div className="overall-bar-fill" style={{ width: `${stats.pct}%` }} />
          </div>
          <span className="overall-pct">{stats.pct}% Complete</span>
        </div>
      </div>

      {/* ── Focus Cards ───────────────────────────────────── */}
      <div className="focus-cards">
        <div className="focus-card">
          <h4>Current Focus Topic</h4>
          {currentFocusTopic ? (
            <>
              <div className="focus-title">Week {currentFocusTopic.weekNum}: {currentFocusTopic.name}</div>
              <div className="focus-prog">
                <span>{currentFocusTopic.done}/{currentFocusTopic.total}</span>
                <div className="focus-bar">
                  <div className="focus-bar-fill" style={{width: `${currentFocusTopic.pct}%`}}></div>
                </div>
              </div>
            </>
          ) : (
            <div className="focus-title">All Topics Completed</div>
          )}
        </div>
        <div className="focus-card">
          <h4>Next Scheduled Problem</h4>
          {nextScheduledProblem ? (
            <>
              <div className="focus-title">{nextScheduledProblem.name}</div>
              <div className="focus-meta">
                Scheduled: {nextScheduledProblem.scheduledDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className={`p-badge ${nextScheduledProblem.difficulty}`}>{nextScheduledProblem.difficulty}</span>
              </div>
            </>
          ) : (
            <div className="focus-title">No upcoming problems.</div>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="roadmap-filters form-filters">
        <select name="week" value={filters.week} onChange={handleFilterChange} className="select">
          <option value="all">All Weeks</option>
          {CURRICULUM.map(w => <option key={w.week} value={w.week}>Week {w.week}</option>)}
        </select>

        <select name="topic" value={filters.topic} onChange={handleFilterChange} className="select">
          <option value="all">All Topics</option>
          {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange} className="select">
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select name="status" value={filters.status} onChange={handleFilterChange} className="select">
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>

      {/* ── Curriculum List ────────────────────────────────── */}
      <div className="week-accordion">
        {CURRICULUM.filter(w => filters.week === "all" || w.week.toString() === filters.week).map(week => {
          const weekStat = stats.weekStats.find(s => s.weekNum === week.week);
          const isOpen = openWeeks.has(week.week) || filters.week !== "all" || filters.topic !== "all"; // auto-open if filtered
          
          return (
            <div key={week.week} className={`week-card ${isOpen ? "open" : ""}`}>
              <button 
                className="week-header" 
                onClick={() => toggleWeek(week.week)}
                aria-expanded={isOpen}
              >
                <div className="week-header-left">
                  <span className="week-badge">Week {week.week}</span>
                </div>
                <div className="week-header-right">
                  <div className="week-prog-pill">
                    <div className="week-prog-bar">
                      <div className="week-prog-fill" style={{ width: `${weekStat.pct}%` }} />
                    </div>
                    <span>{weekStat.done}/{weekStat.total}</span>
                  </div>
                  <span className="chevron"></span>
                </div>
              </button>

              {isOpen && (
                <div className="week-body">
                  <div className="week-body-inner">
                    {week.topics.filter(t => filters.topic === "all" || t.name === filters.topic).map(topic => {
                      const topicStat = weekStat.topicStats.find(s => s.name === topic.name);
                      
                      const filteredProblems = topic.problems.filter(p => {
                        const isDone = completed.has(p.id);
                        if (filters.difficulty !== "all" && p.difficulty !== filters.difficulty) return false;
                        if (filters.status === "completed" && !isDone) return false;
                        if (filters.status === "incomplete" && isDone) return false;
                        return true;
                      });

                      if (filteredProblems.length === 0) return null;

                      return (
                        <div key={topic.name} className="prob-section">
                          <div className="prob-section-title">
                            <div className="topic-name-wrap">
                              <span className="dot"></span> 
                              <span className="topic-title-text">{topic.name}</span>
                            </div>
                            <div className="topic-prog-container">
                              <div className="topic-prog-bar">
                                <div className="topic-prog-fill" style={{ width: `${topicStat.pct}%` }} />
                              </div>
                              <span className="topic-prog-text">{topicStat.done}/{topicStat.total}</span>
                            </div>
                          </div>
                          
                          <div className="prob-list">
                            {filteredProblems.map(p => {
                              const isDone = completed.has(p.id);
                              const scheduledDate = new Date(START_DATE);
                              scheduledDate.setDate(scheduledDate.getDate() + p.dayOffset);

                              return (
                                <ProblemRow 
                                  key={p.curriculumId} 
                                  p={p} 
                                  topicName={topic.name}
                                  scheduledDate={scheduledDate}
                                  isDone={isDone}
                                  onToggle={() => toggleProblem(p.id)}
                                  onAddReminder={() => addToReminders(p, topic.name)}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProblemRow({ p, topicName, scheduledDate, isDone, onToggle, onAddReminder }) {
  return (
    <div className={`p-row ${isDone ? "done" : ""}`}>
      <input type="checkbox" checked={isDone} onChange={onToggle} />
      <div className="p-date-col">
        {scheduledDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
      </div>
      <span className="p-id">#{p.id}</span>
      <a href={leetcodeUrl(p.name)} target="_blank" rel="noreferrer" className="p-link">{p.name}</a>
      <div className="p-badges">
        <span className={`p-badge ${p.difficulty}`}>{p.difficulty}</span>
        <span className="p-badge topic">{topicName}</span>
      </div>
      <div className="p-actions">
        <button className="p-btn-rem" onClick={onAddReminder}>+ Reminder</button>
      </div>
    </div>
  );
}

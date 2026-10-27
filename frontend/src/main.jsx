import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, ArrowUpRight, BarChart3, BookOpen, BrainCircuit, Check,
  ChevronDown, CircleHelp, FileText, Hash, LayoutDashboard, MessageCircle,
  MoreHorizontal, PanelLeft, Plus, Search, Settings2, Sparkles, Tags,
  Upload, X, Zap
} from 'lucide-react'
import './styles.css'

const entries = [
  { date: '2026-09-01', mood: 'clear', topics: ['career', 'focus'], text: 'Finally had the conversation with my manager about the workload. It went better than expected. We are moving two low-priority projects off my plate, which already feels like I can breathe again. Need to remember that asking for help is not the same as failing.', score: 92 },
  { date: '2026-08-05', mood: 'restless', topics: ['habits', 'health'], text: 'Sleep has been all over the place this week. I keep reaching for my phone after getting into bed and then wondering why I am tired the next day. Tonight I am leaving it in the kitchen. Small experiment, but I need to make the easy choice the good choice.', score: 76 },
  { date: '2026-07-20', mood: 'energized', topics: ['travel', 'joy'], text: 'Back from Italy. Best two weeks in years, honestly. Florence in particular - just wandering with no plan, eating incredible food, not checking email once. Already thinking about how to protect this feeling once real life resumes tomorrow. Going to try setting a hard stop time for work each day.', score: 88 },
  { date: '2026-06-15', mood: 'grateful', topics: ['travel', 'presence'], text: 'The last morning in Florence. I feel unusually present here, like my brain finally got quiet enough to notice things. The goal for this trip was rest, and I think I actually did it. No optimizing, no five-year plan. Just coffee and a slow walk.', score: 94 },
  { date: '2026-06-02', mood: 'hopeful', topics: ['goals', 'career'], text: 'Made a proper list of what I want the next quarter to feel like. Less reactive. More time for the work that matters. I keep thinking the answer is a dramatic life change, but maybe the answer is protecting two focused hours every morning.', score: 84 },
  { date: '2026-04-10', mood: 'tender', topics: ['family', 'change'], text: 'Called Mum on my walk home. We talked about nothing important for nearly an hour, which was exactly what I needed. There is a particular kind of comfort in being known across all the versions of yourself.', score: 81 },
  { date: '2026-02-28', mood: 'determined', topics: ['career', 'boundaries'], text: 'I said no to the extra work today. It was uncomfortable for about ten minutes, then mostly fine. Writing it down because I want a record of the moment I stopped treating my capacity like an infinite resource.', score: 79 },
  { date: '2026-02-14', mood: 'strained', topics: ['work', 'health'], text: 'Rough week. The Kessler project deadline got moved up and I have been staying late every night. Barely slept. Skipped the gym for the fourth day in a row and I can feel it - more irritable, less patient with everyone including myself. Need to talk to my manager about workload before this becomes a pattern.', score: 61 },
  { date: '2026-01-08', mood: 'curious', topics: ['reflection', 'goals'], text: 'New year, but I do not want to make a giant list of promises. I want to pay attention. What gives me energy? What quietly drains it? The practice this year is noticing before reacting.', score: 73 }
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Ask AI', icon: MessageCircle },
  { label: 'Journal entries', icon: BookOpen },
  { label: 'Themes', icon: Tags },
]

const themeCounts = [
  ['career', 78, 'cyan'], ['health', 53, 'green'], ['travel', 46, 'amber'], ['goals', 39, 'violet'], ['family', 28, 'rose']
]

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function generateJournalResponse(question) {
  const normalizedQuestion = question.toLowerCase()
  const isWorkQuestion = /work|career|job|manager|project|deadline|professional/.test(normalizedQuestion)
  const isJuneQuestion = /june|summer|travel|florence|italy/.test(normalizedQuestion)
  const isGroundingQuestion = /ground|calm|happy|joy|peace|well|better|feel/.test(normalizedQuestion)
  const isGoalQuestion = /goal|future|plan|change|habit|improve|next/.test(normalizedQuestion)
  const isHealthQuestion = /health|sleep|gym|tired|stress|energy/.test(normalizedQuestion)

  if (isWorkQuestion) {
    return 'Your work entries show a meaningful shift from carrying everything alone to protecting your capacity. On Feb 28, you said no to extra work; by Sep 1, you had asked your manager for support and felt relief. That is real progress, not a small detail. Keep treating clarity as a strength: choose one boundary you can name and protect this week.'
  }

  if (isJuneQuestion) {
    return 'June reads like a return to presence. On Jun 2, you wanted less reactivity and more focused time; on Jun 15, you described a quiet mind, a slow walk, and rest without optimizing. The encouraging part is that you already know what helps: fewer inputs, more room, and time that does not need to produce anything.'
  }

  if (isGroundingQuestion) {
    return 'Your most grounded moments come when you slow down enough to notice what is already happening. You wrote about an unplanned walk in Florence, a quiet coffee, a long call with Mum, and protecting focused mornings. You do not need to reinvent yourself to feel better. Try making one small pocket of that kind of space today.'
  }

  if (isHealthQuestion) {
    return 'Your entries connect your wellbeing closely to boundaries and recovery. When work expanded in February, sleep and patience were the first things to suffer. When you created space in June and July, you felt present and energized. Start gently: protect one sleep-supporting choice tonight, and let consistency do the motivating.'
  }

  if (isGoalQuestion) {
    return 'The clearest goal across your journal is not a dramatic transformation. It is building a life that feels less reactive: two focused hours, a hard stop for work, enough rest, and the confidence to say no. You have already practiced each of these. Pick the smallest version and begin there.'
  }

  return 'I notice a steady thread in your entries: you understand yourself best when you pause before reacting. You have written honestly about strain, and you have also documented the choices that bring you back to yourself. That awareness is a strong foundation. What is one kind, specific choice you can make for yourself today?'
}

function App() {
  const [activeView, setActiveView] = useState('Overview')
  const [journalEntries, setJournalEntries] = useState(entries)
  const [selectedEntry, setSelectedEntry] = useState(entries[0])
  const [query, setQuery] = useState('')
  const [entryFilter, setEntryFilter] = useState('All entries')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const filteredEntries = useMemo(() => journalEntries.filter((entry) => {
    const matchesSearch = `${entry.date} ${entry.text} ${entry.topics.join(' ')}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = entryFilter === 'All entries' || entry.topics.includes(entryFilter)
    return matchesSearch && matchesFilter
  }), [query, entryFilter])

  const sendQuestion = (question = chatInput) => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion) return
    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }, { role: 'ai', text: generateJournalResponse(cleanQuestion) }])
    setChatInput('')
  }

  const syncEntries = () => {
    setSyncing(true)
    window.setTimeout(() => setSyncing(false), 1300)
  }

  const addEntry = (entry) => {
    setJournalEntries((current) => [entry, ...current].sort((a, b) => b.date.localeCompare(a.date)))
    setSelectedEntry(entry)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><BrainCircuit size={20} /></div>
          <div><strong>Journal Analyzer</strong><span>Personal intelligence</span></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={16} /></button>
        </div>
        <div className="workspace-label">WORKSPACE <span>LOCAL</span></div>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeView === label ? 'active' : ''}`} onClick={() => { setActiveView(label); setMobileNav(false) }}><Icon size={17} /><span>{label}</span>{label === 'Ask AI' && <i className="nav-dot" />}</button>)}
        </nav>
        <div className="nav-divider" />
        <div className="workspace-label">YOUR SPACE</div>
        <button className="nav-item" onClick={() => setActiveView('Settings')}><Settings2 size={17} /><span>Settings</span></button>
        <div className="sidebar-bottom">
          <div className="privacy-card"><div className="privacy-icon"><Zap size={15} /></div><div><strong>Private by design</strong><span>Your entries stay local.</span></div></div>
          <div className="profile-row"><div className="avatar">S</div><div><strong>Sooraj's journal</strong><span>9 entries indexed</span></div><MoreHorizontal size={17} className="muted" /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMobileNav(true)} aria-label="Open navigation"><PanelLeft size={18} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><strong>{activeView}</strong></div>
          <div className="top-actions">
            <button className="search-trigger" onClick={() => document.querySelector('.global-search input')?.focus()}><Search size={16} /><span>Search your journal</span><kbd>⌘ K</kbd></button>
            <div className="model-chip"><span className="status-pulse" /> <span>Local model</span><ChevronDown size={14} /></div>
            <button className={`sync-button ${syncing ? 'syncing' : ''}`} onClick={syncEntries}><Upload size={15} /> {syncing ? 'Syncing...' : 'Sync entries'}</button>
          </div>
        </header>

        {activeView === 'Overview' && <Overview setActiveView={setActiveView} syncing={syncing} />}
        {activeView === 'Ask AI' && <ChatView messages={messages} chatInput={chatInput} setChatInput={setChatInput} sendQuestion={sendQuestion} />}
        {activeView === 'Journal entries' && <EntriesView filteredEntries={filteredEntries} query={query} setQuery={setQuery} selectedEntry={selectedEntry} setSelectedEntry={setSelectedEntry} entryFilter={entryFilter} setEntryFilter={setEntryFilter} onAddEntry={addEntry} />}
        {activeView === 'Themes' && <ThemesView />}
        {activeView === 'Settings' && <SettingsView syncing={syncing} syncEntries={syncEntries} />}
      </main>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({ setActiveView, syncing }) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return <div className="page-wrap">
    <PageHeader eyebrow={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now)} title={`${greeting}, Sooraj.`} description="Here is the shape of your inner world, made visible." action={<button className="ghost-button" onClick={() => setActiveView('Ask AI')}><Sparkles size={15} /> Explore with AI <ArrowUpRight size={15} /></button>} />
    <section className="metric-grid">
      <MetricCard label="Journal entries" value="9" delta="+3 this quarter" icon={FileText} accent="cyan" />
      <MetricCard label="Themes discovered" value="18" delta="Across 6 categories" icon={Hash} accent="violet" />
      <MetricCard label="Journal coverage" value="84%" delta="9 of 11 months" icon={Activity} accent="green" gauge />
      <MetricCard label="Current streak" value="12 days" delta="Your longest: 21 days" icon={Zap} accent="amber" />
    </section>
    <section className="content-grid">
      <div className="panel heatmap-panel"><PanelHeading title="Your rhythm" subtitle="Entry frequency and emotional tone" action={<button className="icon-button"><MoreHorizontal size={17} /></button>} /><Heatmap /><div className="heatmap-legend"><span>Less</span>{[1,2,3,4,5].map((n) => <i key={n} className={`heat-cell level-${n}`} />)}<span>More</span><div className="legend-spacer" /><span className="mood-key"><i className="mood-dot positive" /> positive</span><span className="mood-key"><i className="mood-dot tense" /> tense</span></div></div>
      <div className="panel themes-panel"><PanelHeading title="Themes in focus" subtitle="Based on your recent entries" action={<button className="text-button" onClick={() => setActiveView('Themes')}>View all <ArrowUpRight size={14} /></button>} /><div className="theme-bars">{themeCounts.map(([name, width, color], index) => <div className="theme-row" key={name}><div className="theme-label"><span className={`theme-icon ${color}`}>{index + 1}</span><strong>{name}</strong><span className="theme-count">{Math.round(width / 9)} entries</span></div><div className="bar-track"><div className={`bar-fill ${color}`} style={{ width: `${width}%` }} /></div><span className="bar-value">{width}%</span></div>)}</div></div>
    </section>
    <section className="lower-grid"><div className="panel insight-panel"><div className="insight-kicker"><Sparkles size={15} /> A small pattern worth noticing</div><h2>Boundaries make space for the good stuff.</h2><p>Your most positive entries mention protecting time, moving slowly, or saying no. Your February entry describes the opposite pattern.</p><button className="outline-button" onClick={() => setActiveView('Ask AI')}>Ask about this pattern <ArrowUpRight size={15} /></button></div><div className="panel activity-panel"><PanelHeading title="Recent activity" subtitle="Latest journal signals" action={<button className="icon-button"><MoreHorizontal size={17} /></button>} /><div className="activity-list">{entries.slice(0, 3).map((entry) => <div className="activity-item" key={entry.date}><div className={`activity-dot ${entry.mood}`} /><div><strong>{entry.topics[0]} <span>theme noted</span></strong><p>{formatDate(entry.date)} · {entry.text.slice(0, 58)}...</p></div><ArrowUpRight size={14} className="muted" /></div>)}</div></div></section>
  </div>
}

function MetricCard({ label, value, delta, icon: Icon, accent, gauge }) { return <div className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={17} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small><span className="trend">{gauge ? '●' : '↗'}</span> {delta}</small></div>{gauge && <div className="gauge"><span>84</span></div>}</div> }
function PanelHeading({ title, subtitle, action }) { return <div className="panel-heading"><div><h3>{title}</h3><span>{subtitle}</span></div>{action}</div> }
function Heatmap() { return <div className="heatmap-wrap"><div className="month-labels"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div><div className="heatmap"><div className="week-labels"><span>Mon</span><span>Wed</span><span>Fri</span></div><div className="heat-grid">{Array.from({ length: 117 }, (_, index) => <i key={index} className={`heat-cell level-${[0, 1, 2, 3, 4, 1, 0, 2, 0, 3, 1, 0, 4, 2, 0][index % 15]}`} />)}</div></div></div> }

function ChatView({ messages, chatInput, setChatInput, sendQuestion }) { return <div className="page-wrap chat-page"><PageHeader eyebrow="Grounded conversation" title="Ask your journal anything." description="Answers stay close to what you wrote, with the memories that shaped them." /><div className="chat-layout"><div className="chat-panel panel"><div className="chat-topline"><div className="ai-orb"><BrainCircuit size={20} /></div><div><strong>Journal intelligence</strong><span>Ready to search 9 entries</span></div><div className="online-status"><i /> local context</div></div><div className="message-feed">{messages.length === 0 ? <div className="empty-chat"><div className="empty-spark"><Sparkles size={22} /></div><h2>Start with a question</h2><p>I will look for patterns across your entries and show you exactly where they come from.</p></div> : messages.map((message, index) => <div className={`message ${message.role}`} key={index}><div className="message-avatar">{message.role === 'ai' ? <BrainCircuit size={15} /> : 'S'}</div><div><span className="message-label">{message.role === 'ai' ? 'Journal AI' : 'Sooraj'}</span><p>{message.text}</p>{message.role === 'ai' && <div className="sources"><div><FileText size={13} /><span>3 retrieved context sources</span></div><ChevronDown size={14} /></div>}</div></div>)}</div><div className="suggestions">{['What changed in my work life?', 'Summarize June 2026', 'What helps me feel grounded?'].map((suggestion) => <button key={suggestion} onClick={() => sendQuestion(suggestion)}>{suggestion} <ArrowUpRight size={13} /></button>)}</div><div className="chat-input"><textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendQuestion() } }} placeholder="Ask a question about your journal..." rows="1" /><button onClick={() => sendQuestion()} aria-label="Send question"><ArrowUpRight size={18} /></button></div><div className="chat-footer"><span><Zap size={12} /> Answers grounded in your local entries</span><kbd>Enter to send</kbd></div></div><aside className="chat-aside"><div className="panel mini-panel"><div className="aside-icon"><CircleHelp size={17} /></div><strong>Good questions are specific</strong><p>Ask about a timeframe, a feeling, or a pattern you want to understand.</p></div><div className="panel mini-panel"><span className="eyebrow">RETRIEVAL STATUS</span><div className="retrieval-number">09 <small>entries indexed</small></div><div className="progress-line"><span /></div><p>Embeddings are up to date.</p></div></aside></div></div> }

function EntriesView({ filteredEntries, query, setQuery, selectedEntry, setSelectedEntry, entryFilter, setEntryFilter, onAddEntry }) {
  const [composerOpen, setComposerOpen] = useState(false)
  const [draftDate, setDraftDate] = useState(new Date().toISOString().slice(0, 10))
  const [draftMood, setDraftMood] = useState('reflective')
  const [draftTopics, setDraftTopics] = useState('reflection')
  const [draftText, setDraftText] = useState('')

  const submitEntry = (event) => {
    event.preventDefault()
    const text = draftText.trim()
    if (!text || !draftDate) return
    const newEntry = {
      date: draftDate,
      mood: draftMood.trim() || 'reflective',
      topics: draftTopics.split(',').map((topic) => topic.trim().toLowerCase()).filter(Boolean),
      text,
      score: 100
    }
    onAddEntry(newEntry)
    setComposerOpen(false)
    setDraftText('')
  }

  return <div className="page-wrap"><PageHeader eyebrow="Your archive" title="Journal entries" description="Browse the moments that make up the bigger picture." action={<button className="sync-button" onClick={() => setComposerOpen(true)}><Plus size={15} /> Add entry</button>} />
    {composerOpen && <form className="entry-composer panel" onSubmit={submitEntry}><div className="composer-heading"><div><div className="eyebrow">New journal entry</div><h2>Make space for the moment.</h2></div><button type="button" className="icon-button" onClick={() => setComposerOpen(false)} aria-label="Close entry form"><X size={17} /></button></div><div className="composer-fields"><label>Date<input type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} required /></label><label>Mood<input value={draftMood} onChange={(event) => setDraftMood(event.target.value)} placeholder="e.g. hopeful" /></label><label className="topic-field">Topics <span>comma separated</span><input value={draftTopics} onChange={(event) => setDraftTopics(event.target.value)} placeholder="e.g. work, family" /></label></div><label className="text-field">What is on your mind?<textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} placeholder="Write freely. This stays in your local workspace." rows="5" required /></label><div className="composer-footer"><span><Zap size={13} /> Saved locally and ready to index</span><button className="sync-button" type="submit"><Check size={15} /> Save entry</button></div></form>}
    <div className="entries-toolbar"><div className="global-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search entries, themes, or dates..." /></div><div className="filter-pills">{['All entries', 'career', 'health', 'travel'].map((filter) => <button className={entryFilter === filter ? 'selected' : ''} onClick={() => setEntryFilter(filter)} key={filter}>{filter}</button>)}</div></div><div className="entries-layout"><div className="entries-list panel">{filteredEntries.map((entry) => <button className={`entry-row ${selectedEntry.date === entry.date ? 'selected' : ''}`} onClick={() => setSelectedEntry(entry)} key={`${entry.date}-${entry.text}`}><div className="entry-date"><span>{new Date(`${entry.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span><strong>{new Date(`${entry.date}T12:00:00`).getDate()}</strong></div><div className="entry-summary"><strong>{entry.text.slice(0, 46)}...</strong><span>{entry.topics.map((topic) => `#${topic}`).join('  ')}</span></div><ArrowUpRight size={15} className="muted" /></button>)}</div><div className="entry-inspector panel"><div className="inspector-toolbar"><span className="file-label"><FileText size={15} /> {selectedEntry.date}.md</span><span className="indexed"><Check size={13} /> indexed</span></div><div className="entry-content"><div className="entry-meta"><span>{formatDate(selectedEntry.date)}</span><span>{selectedEntry.text.split(' ').length} words</span><span className={`mood-pill ${selectedEntry.mood}`}>{selectedEntry.mood}</span></div><h2>{formatDate(selectedEntry.date)}</h2><p>{selectedEntry.text}</p><div className="tag-cloud">{selectedEntry.topics.map((topic) => <span key={topic}>#{topic}</span>)}</div></div><div className="entry-footer"><span><BrainCircuit size={14} /> semantic match <strong>{selectedEntry.score}%</strong></span><button className="text-button">Open raw file <ArrowUpRight size={14} /></button></div></div></div></div>
}

function ThemesView() { return <div className="page-wrap"><PageHeader eyebrow="Pattern library" title="Themes & categories" description="A living index of what keeps showing up." /><div className="theme-overview"><div className="panel theme-intro"><div className="big-theme-icon"><Tags size={23} /></div><h2>18 themes found</h2><p>Topics are inferred from your entries and refined as your archive grows.</p><button className="outline-button">Run auto-tagging <Sparkles size={15} /></button></div><div className="panel all-themes"><PanelHeading title="Most present" subtitle="Across your indexed archive" />{themeCounts.concat([['presence', 25, 'blue']]).map(([name, width, color]) => <div className="theme-row large" key={name}><div className="theme-label"><span className={`theme-icon ${color}`}><Hash size={13} /></span><strong>{name}</strong><span className="theme-count">{Math.round(width / 9)} entries</span></div><div className="bar-track"><div className={`bar-fill ${color}`} style={{ width: `${width}%` }} /></div><span className="bar-value">{width}%</span></div>)}</div></div></div> }

function SettingsView({ syncing, syncEntries }) { return <div className="page-wrap"><PageHeader eyebrow="Workspace controls" title="Settings" description="Keep your local intelligence layer healthy and transparent." /><div className="settings-grid"><div className="panel setting-card"><div className="setting-icon green"><Check size={17} /></div><div><h3>Index health</h3><p>All 9 entries are embedded and ready to retrieve.</p><div className="setting-status"><span className="status-pulse" /> Healthy <span>·</span> 9 chunks</div></div></div><div className="panel setting-card"><div className="setting-icon cyan"><BrainCircuit size={17} /></div><div><h3>Answer model</h3><p>Local model keeps your journal on this machine.</p><div className="setting-select">google/flan-t5-small <ChevronDown size={14} /></div></div></div><div className="panel setting-card"><div className="setting-icon violet"><Upload size={17} /></div><div><h3>Ingestion</h3><p>Scan the entries folder for new or changed files.</p><button className="outline-button" onClick={syncEntries}>{syncing ? 'Syncing...' : 'Sync now'} <ArrowUpRight size={15} /></button></div></div></div></div> }

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)

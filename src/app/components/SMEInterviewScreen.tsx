import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Send, AlertCircle, Sparkles, Clock,
  CheckCircle, FileText, ChevronDown, Plus,
} from 'lucide-react';

interface SMEInterviewScreenProps {
  onBack: () => void;
}

type Tab = 'interview' | 'pending' | 'my';
type InterviewStyle = 'structured' | 'freeform';

const SUBJECTS = ['Milk Tea', 'Coffee', 'Car', 'Rock Climbing'];

// ── Pending reviews ────────────────────────────────────────────────────────────
const PENDING_DOCS = [
  { id: 1, subject: 'Coffee',       mode: 'Structured', submittedBy: 'Jane D.',   date: 'Apr 29, 2026', status: 'Pending' },
  { id: 2, subject: 'Rock Climbing', mode: 'Freeform',   submittedBy: 'Marcus L.', date: 'Apr 28, 2026', status: 'Pending' },
  { id: 3, subject: 'Milk Tea',     mode: 'Structured', submittedBy: 'Priya S.',  date: 'Apr 27, 2026', status: 'Under Review' },
];

// ── My Interviews rows ─────────────────────────────────────────────────────────
const MY_ROWS = [
  {
    date: 'Apr 30, 2026',
    subject: 'Coffee',
    mode: 'Freeform',
    status: 'Approved',
    preview: '# Knowledge Summary: Coffee ## Topic...',
  },
  {
    date: 'Apr 30, 2026',
    subject: 'Coffee',
    mode: 'Structured',
    status: 'In Progress',
    preview: '—',
  },
];

// ── Chat types ─────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  sender: 'thoth' | 'sme';
  text: string;
  hasAlert?: boolean;
}

export function SMEInterviewScreen({ onBack }: SMEInterviewScreenProps) {
  const [activeTab, setActiveTab]         = useState<Tab>('interview');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [style, setStyle]                 = useState<InterviewStyle>('structured');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [inputValue, setInputValue]       = useState('');
  const idRef                             = useRef(0);
  const bottomRef                         = useRef<HTMLDivElement>(null);

  const nextId = () => { idRef.current += 1; return idRef.current; };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'interview', label: 'Interview'        },
    { key: 'pending',   label: 'Pending Reviews'  },
    { key: 'my',        label: 'My Interviews'    },
  ];

  // ── Start the interview ──────────────────────────────────────────────────────
  const handleStartInterview = () => {
    if (!selectedSubject) return;
    const styleLabel = style === 'structured' ? 'Structured' : 'Freeform';
    setInterviewStarted(true);
    setMessages([
      {
        id: nextId(),
        sender: 'thoth',
        text: `Hello! I'm Thoth, your AI interview assistant. We'll be using a ${styleLabel} format to capture your knowledge about ${selectedSubject}.`,
      },
      {
        id: nextId(),
        sender: 'thoth',
        text: style === 'structured'
          ? `Let's start with the basics: What are the key facts everyone should know about ${selectedSubject}?`
          : `Great — I'll follow your lead. Start by sharing whatever feels most important about ${selectedSubject}, and I'll step in only when I need more clarity.`,
        hasAlert: true,
      },
    ]);
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { id: nextId(), sender: 'sme', text }]);

    setTimeout(() => {
      const structured = [
        `Great — now let's talk about the most common questions people ask about ${selectedSubject}.`,
        `Noted! What are the most frequent mistakes beginners make with ${selectedSubject}?`,
        `That's useful context. Can you describe any escalation triggers — situations that require expert intervention?`,
        `Understood. How would you explain this to someone completely new to ${selectedSubject}?`,
      ];
      const freeform = [
        `Interesting. Can you expand on that point a little more?`,
        `I noticed you mentioned a key detail — could you clarify what you meant there?`,
        `That's useful context. What would you say is the single most important thing to know?`,
        `Got it. Is there anything you'd add that an expert often overlooks?`,
      ];
      const pool = style === 'structured' ? structured : freeform;
      setMessages(prev => [
        ...prev,
        {
          id: nextId(),
          sender: 'thoth',
          text: pool[Math.floor(Math.random() * pool.length)],
          hasAlert: Math.random() > 0.5,
        },
      ]);
    }, 900);
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setMessages([]);
    setInputValue('');
    setSelectedSubject('');
    setStyle('structured');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* Header */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" style={{ color: '#E20074' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg" style={{ color: '#E20074' }}>SME Dashboard</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'interview' && (interviewStarted ? `Interview · ${selectedSubject}` : 'Start a new interview')}
              {activeTab === 'pending'   && 'Documents awaiting admin approval'}
              {activeTab === 'my'        && 'Your interview history'}
            </p>
          </div>
          
        </div>

        {/* Tab pills */}
        <div className="px-6 pb-4 flex items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key !== 'interview') resetInterview(); }}
              className="px-4 py-1.5 rounded-full border text-sm transition-colors"
              style={
                activeTab === tab.key
                  ? { backgroundColor: '#000', borderColor: '#000', color: '#fff' }
                  : { backgroundColor: '#fff', borderColor: '#000', color: '#000' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INTERVIEW TAB ────────────────────────────────────────────────── */}
      {activeTab === 'interview' && !interviewStarted && (
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-xl p-8 space-y-7">
            <h2 className="text-xl text-gray-900">Start a new interview</h2>

            {/* Demo notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-800">
                <strong>Demo Topics</strong> — The subjects below are for demonstration purposes only.
              </p>
            </div>

            {/* Subject dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Subject</label>
                <button className="flex items-center gap-1 text-xs" style={{ color: '#E20074' }}>
                  <Plus className="w-3 h-3" />
                  New subject
                </button>
              </div>
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:border-[#E20074] bg-white text-gray-700"
                >
                  <option value="" disabled>— pick one of your subjects —</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Interview style */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Interview Style</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Structured */}
                <button
                  onClick={() => setStyle('structured')}
                  className={`text-left rounded-xl border-2 px-4 py-4 transition-all ${
                    style === 'structured'
                      ? 'border-[#E20074] bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {/* Radio */}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      style === 'structured' ? 'border-[#E20074]' : 'border-gray-300'
                    }`}>
                      {style === 'structured' && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E20074' }} />
                      )}
                    </div>
                    <span className="text-sm text-gray-900">Structured</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Thoth walks you through key facts → common questions → mistakes → escalation triggers.
                  </p>
                </button>

                {/* Freeform */}
                <button
                  onClick={() => setStyle('freeform')}
                  className={`text-left rounded-xl border-2 px-4 py-4 transition-all ${
                    style === 'freeform'
                      ? 'border-[#E20074] bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      style === 'freeform' ? 'border-[#E20074]' : 'border-gray-300'
                    }`}>
                      {style === 'freeform' && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E20074' }} />
                      )}
                    </div>
                    <span className="text-sm text-gray-900">Freeform</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Share what you know; Thoth follows up only when something is unclear.
                  </p>
                </button>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStartInterview}
              disabled={!selectedSubject}
              className="w-full py-3.5 rounded-full text-white text-sm transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#E20074' }}
            >
              Start Interview
            </button>
          </div>
        </div>
      )}

      {/* Interview — chat view */}
      {activeTab === 'interview' && interviewStarted && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat session bar */}
          <div className="bg-pink-50 border-b border-pink-200 px-6 py-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#E20074' }}>
              <Sparkles className="w-4 h-4" />
              <span>{selectedSubject} · {style === 'structured' ? 'Structured' : 'Freeform'}</span>
            </div>
            <button
              onClick={resetInterview}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              ← Back to setup
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'sme' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[65%] rounded-2xl px-5 py-3 ${
                  msg.sender === 'sme'
                    ? 'bg-[#E20074] text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}>
                  {msg.sender === 'thoth' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Sparkles className="w-4 h-4" style={{ color: '#E20074' }} />
                      <span className="text-xs" style={{ color: '#E20074' }}>Thoth AI</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.hasAlert && msg.sender === 'thoth' && (
                    <div className="flex items-center space-x-1 mt-2 text-xs" style={{ color: '#E20074' }}>
                      <AlertCircle className="w-3 h-3" />
                      <span>Key question</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your response…"
                className="flex-1 border border-gray-300 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#E20074]"
              />
              <button
                onClick={sendMessage}
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#E20074' }}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING REVIEWS TAB ─────────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {PENDING_DOCS.map(doc => (
              <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center gap-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" style={{ color: '#E20074' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{doc.subject}
                    <span className="text-gray-400 ml-2 text-xs">{doc.mode}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Submitted by {doc.submittedBy} · {doc.date}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border flex-shrink-0 ${
                  doc.status === 'Pending'
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-blue-50 border-blue-300 text-blue-700'
                }`}>
                  {doc.status === 'Pending'
                    ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{doc.status}</span>
                    : <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{doc.status}</span>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MY INTERVIEWS TAB ───────────────────────────────────────────── */}
      {activeTab === 'my' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Date', 'Subject', 'Mode', 'Status', 'Synthesis Preview'].map(col => (
                    <th
                      key={col}
                      className="text-left text-xs text-gray-400 uppercase tracking-wide px-6 py-4"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MY_ROWS.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors`}>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{row.date}</td>
                    <td className="px-6 py-4 text-gray-900">{row.subject}</td>
                    <td className="px-6 py-4 text-gray-500">{row.mode}</td>
                    <td className="px-6 py-4">
                      {row.status === 'Approved' ? (
                        <span className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">{row.status}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-yellow-600">
                          <Clock className="w-4 h-4" />
                          <span>{row.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                      {row.preview === '—'
                        ? <span className="text-gray-300">—</span>
                        : <span className="font-mono text-xs text-gray-500">{row.preview}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

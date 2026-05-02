import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Database, FileText, Clock, AlertTriangle,
  CheckCircle, Users, Mail, TrendingUp, X,
  Activity, BarChart2, Download,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdminDashboardProps {
  onBack: () => void;
}

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab          = 'queue' | 'escalations' | 'directory';
type EscSubFilter = 'active' | 'archive';

// ── Approval Queue data ────────────────────────────────────────────────────────
type QueueStatus = 'Pending Review' | 'Under Review';

const QUEUE_DOCS = [
  { id: 1, name: 'Jane D.',   subject: 'Coffee',        date: 'Apr 29, 2026', status: 'Pending Review' as QueueStatus },
  { id: 2, name: 'Marcus L.', subject: 'Rock Climbing', date: 'Apr 28, 2026', status: 'Under Review'   as QueueStatus },
  { id: 3, name: 'Priya S.',  subject: 'Milk Tea',      date: 'Apr 27, 2026', status: 'Pending Review' as QueueStatus },
  { id: 4, name: 'Tomás R.',  subject: 'Car',           date: 'Apr 26, 2026', status: 'Under Review'   as QueueStatus },
];

// ── Escalations data ───────────────────────────────────────────────────────────
interface Escalation {
  id: number;
  from: string;
  timestamp: string;
  question: string;
  reason: string;
  status: 'active' | 'archive';
  fullContext: string;
}

const ESCALATIONS: Escalation[] = [
  {
    id: 1,
    from: 'Alex Rivera',
    timestamp: '4/30/2026, 11:50 PM',
    question: 'how do i cook pasta',
    reason: 'Cooking pasta is not related to any of the available subjects (Coffee, Milk Tea, Cars, Rock Climbing).',
    status: 'active',
    fullContext:
      'User "Alex Rivera" sent a message asking about cooking pasta. This topic falls entirely outside the current knowledge base. No SME was matched. The message was auto-escalated after Thoth failed to route it to any expert agent.\n\nSuggested action: Notify user that this topic is not currently supported, or consider adding a Culinary subject.',
  },
  {
    id: 2,
    from: 'Sam Nguyen',
    timestamp: '4/30/2026, 9:15 AM',
    question: 'what stocks should i buy?',
    reason: 'Financial advice is out of scope and not covered by any available SME subject.',
    status: 'active',
    fullContext:
      'User "Sam Nguyen" asked for stock investment advice. Thoth was unable to route this to any available expert. No SME subject covers financial markets.\n\nSuggested action: Inform user that Thoth does not provide financial advice, and direct them to appropriate resources.',
  },
  {
    id: 3,
    from: 'Dana Kim',
    timestamp: '4/29/2026, 3:42 PM',
    question: 'can you book a flight for me?',
    reason: "Task automation (booking services) is beyond Thoth's conversational scope.",
    status: 'archive',
    fullContext:
      'User "Dana Kim" requested a flight booking. Thoth is a knowledge-capture assistant and cannot perform transactional tasks or interact with external services.\n\nResolved: User was informed of Thoth\'s scope and redirected to airline booking platforms.',
  },
];

// ── SME Directory data ─────────────────────────────────────────────────────────
const SME_DIRECTORY = [
  { subject: 'Coffee',        description: 'Specialty brewing, espresso techniques, origin sourcing, and barista training.', sme: 'Barista Aria',  specialty: 'Coffee Specialist',      email: 'aria@thoth.ai' },
  { subject: 'Milk Tea',      description: 'Bubble tea culture, tea leaf grades, sweetness ratios, and tapioca preparation.', sme: 'Master Chen',   specialty: 'Milk Tea Expert',         email: 'chen@thoth.ai' },
  { subject: 'Cars',          description: 'Automotive mechanics, vehicle diagnostics, driving dynamics, and EV technology.',  sme: 'Mechanic Rex',  specialty: 'Automotive Expert',       email: 'rex@thoth.ai'  },
  { subject: 'Rock Climbing', description: 'Route reading, gear safety, bouldering technique, and mental performance.',       sme: 'Climber Zoe',   specialty: 'Rock Climbing Expert',    email: 'zoe@thoth.ai'  },
];

// ── Drawer chart / feed data ───────────────────────────────────────────────────
const topicAccessData = [
  { topic: 'Coffee',    sessions: 142 },
  { topic: 'Milk Tea',  sessions: 118 },
  { topic: 'Cars',      sessions: 95  },
  { topic: 'Climbing',  sessions: 67  },
];

const dailyActiveData = [
  { day: 'Mon', users: 210 },
  { day: 'Tue', users: 265 },
  { day: 'Wed', users: 248 },
  { day: 'Thu', users: 310 },
  { day: 'Fri', users: 298 },
  { day: 'Sat', users: 180 },
  { day: 'Sun', users: 155 },
];

const ACTIVITY_FEED = [
  { user: 'Alex Rivera',  action: 'Started a Coffee session',     time: '2m ago'  },
  { user: 'Sam Nguyen',   action: 'Completed Rock Climbing chat',  time: '8m ago'  },
  { user: 'Priya S.',     action: 'Submitted Coffee interview',    time: '15m ago' },
  { user: 'Dana Kim',     action: 'Opened Milk Tea session',       time: '22m ago' },
  { user: 'Tomás R.',     action: 'Reviewed Cars knowledge doc',   time: '41m ago' },
];

// ── Custom chart components (avoids Recharts internal duplicate-key bug) ───────

function DailyActiveUsersChart() {
  const data = dailyActiveData;
  const max = Math.max(...data.map(d => d.users));
  const W = 300, H = 100, pad = 4;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.users / max) * (H - pad * 2));
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `${pad},${H - pad} ${polyline} ${W - pad},${H - pad}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="daily-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E20074" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#E20074" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#daily-grad)" />
        <polyline points={polyline} fill="none" stroke="#E20074" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - pad * 2);
          const y = H - pad - ((d.users / max) * (H - pad * 2));
          return <circle key={d.day} cx={x} cy={y} r={3} fill="#E20074" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map(d => (
          <span key={d.day} className="text-gray-400" style={{ fontSize: 9 }}>{d.day}</span>
        ))}
      </div>
    </div>
  );
}

function TopicAccessChart() {
  const data = topicAccessData;
  const max = Math.max(...data.map(d => d.sessions));
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.topic} className="flex items-center gap-2">
          <span className="text-gray-500 w-14 text-right flex-shrink-0" style={{ fontSize: 10 }}>{d.topic}</span>
          <div className="flex-1 bg-gray-200 rounded-full overflow-hidden" style={{ height: 10 }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.sessions / max) * 100}%`, backgroundColor: '#E20074' }}
            />
          </div>
          <span className="text-gray-400 w-6 flex-shrink-0" style={{ fontSize: 10 }}>{d.sessions}</span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab,   setActiveTab]   = useState<Tab>('queue');
  const [escFilter,   setEscFilter]   = useState<EscSubFilter>('active');
  const [selectedEsc, setSelectedEsc] = useState<Escalation | null>(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [exporting,   setExporting]   = useState(false);

  const toggleDrawer  = () => setDrawerOpen(v => !v);
  const closeDrawer   = () => setDrawerOpen(false);

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pink   = '#E20074';
      const pageW  = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = 0;

      // Header banner
      doc.setFillColor(226, 0, 116);
      doc.rect(0, 0, pageW, 56, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Thoth — Company Usage Summary', margin, 36);

      y = 80;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);

      // ── Key Metrics ──
      y += 24;
      doc.setFontSize(11);
      doc.setTextColor(226, 0, 116);
      doc.text('KEY METRICS', margin, y);
      doc.setDrawColor(226, 0, 116);
      doc.line(margin, y + 4, pageW - margin, y + 4);

      const metrics = [
        { label: 'Active Users',     value: '1,284', trend: '+12% vs last week' },
        { label: 'Sessions Today',   value: '342',   trend: '+8% vs last week'  },
        { label: 'Avg. Chat Length', value: '6.4m',  trend: '-2% vs last week'  },
        { label: 'Resolution Rate',  value: '91%',   trend: '+3% vs last week'  },
      ];
      y += 18;
      const colW = (pageW - margin * 2) / 2;
      metrics.forEach((m, i) => {
        const cx = margin + (i % 2) * colW;
        const cy = y + Math.floor(i / 2) * 60;
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(cx, cy, colW - 8, 50, 4, 4, 'F');
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(m.label, cx + 10, cy + 16);
        doc.setFontSize(18);
        doc.setTextColor(226, 0, 116);
        doc.text(m.value, cx + 10, cy + 36);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(m.trend, cx + 10, cy + 46);
      });

      // ── Daily Active Users ──
      y += 140;
      doc.setFontSize(11);
      doc.setTextColor(226, 0, 116);
      doc.text('DAILY ACTIVE USERS', margin, y);
      doc.line(margin, y + 4, pageW - margin, y + 4);

      y += 16;
      const chartW = pageW - margin * 2;
      const chartH = 70;
      const maxUsers = Math.max(...dailyActiveData.map(d => d.users));
      const barW = chartW / dailyActiveData.length;

      dailyActiveData.forEach((d, i) => {
        const barH = (d.users / maxUsers) * chartH;
        const bx   = margin + i * barW + barW * 0.15;
        const by   = y + chartH - barH;
        doc.setFillColor(226, 0, 116);
        doc.roundedRect(bx, by, barW * 0.7, barH, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(d.day, bx + barW * 0.35 - 6, y + chartH + 10);
        doc.setTextColor(80, 80, 80);
        doc.text(String(d.users), bx + barW * 0.35 - 8, by - 4);
      });

      // ── Most Accessed Topics ──
      y += chartH + 30;
      doc.setFontSize(11);
      doc.setTextColor(226, 0, 116);
      doc.text('MOST ACCESSED TOPICS', margin, y);
      doc.line(margin, y + 4, pageW - margin, y + 4);

      y += 16;
      const maxSessions = Math.max(...topicAccessData.map(d => d.sessions));
      topicAccessData.forEach((d, i) => {
        const rowY    = y + i * 28;
        const barMaxW = chartW - 80;
        const fillW   = (d.sessions / maxSessions) * barMaxW;
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(d.topic, margin, rowY + 10);
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(margin + 70, rowY, barMaxW, 12, 3, 3, 'F');
        doc.setFillColor(226, 0, 116);
        doc.roundedRect(margin + 70, rowY, fillW, 12, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(String(d.sessions), margin + 70 + barMaxW + 6, rowY + 10);
      });

      // ── Recent Activity ──
      y += topicAccessData.length * 28 + 20;
      doc.setFontSize(11);
      doc.setTextColor(226, 0, 116);
      doc.text('RECENT ACTIVITY', margin, y);
      doc.line(margin, y + 4, pageW - margin, y + 4);

      y += 14;
      ACTIVITY_FEED.forEach((item, i) => {
        const rowY = y + i * 22;
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, rowY, pageW - margin * 2, 18, 'F');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(item.user, margin + 6, rowY + 12);
        doc.setTextColor(120, 120, 120);
        doc.text(item.action, margin + 90, rowY + 12);
        doc.text(item.time, pageW - margin - 30, rowY + 12);
      });

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 24;
      doc.setFillColor(226, 0, 116);
      doc.rect(0, footerY, pageW, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('Thoth AI Platform — Confidential', margin, footerY + 15);
      doc.text('Page 1 of 1', pageW - margin - 40, footerY + 15);

      doc.save('thoth-usage-summary.pdf');
      setExporting(false);
    }, 100);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'queue',       label: 'Approval Queue' },
    { key: 'escalations', label: 'Escalations'    },
    { key: 'directory',   label: 'SME Directory'  },
  ];

  const visibleEscalations = ESCALATIONS.filter(e => e.status === escFilter);

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white shadow-sm flex-shrink-0 z-10">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" style={{ color: '#E20074' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg" style={{ color: '#E20074' }}>Admin Dashboard</h1>
            <p className="text-sm text-gray-500">
              {activeTab === 'queue'       && 'SME submissions awaiting approval'}
              {activeTab === 'escalations' && 'Unrouted or flagged user queries'}
              {activeTab === 'directory'   && 'Registered subject matter experts'}
            </p>
          </div>

          {/* Drawer toggle — icon only */}
          <button
            onClick={toggleDrawer}
            title="Company Usage Summary"
            className={`p-2 rounded-full transition-colors ${
              drawerOpen
                ? 'text-white'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            style={drawerOpen ? { backgroundColor: '#E20074' } : {}}
          >
            <BarChart2 className="w-5 h-5" style={{ color: drawerOpen ? '#ffffff' : '#E20074' }} />
          </button>

          
        </div>

        {/* Tab pills */}
        <div className="px-6 pb-4 flex items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {/* ── Body: main content + push drawer ───────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── Main content (shrinks when drawer opens) ────────────────── */}
        <div
          className="flex-1 overflow-hidden flex flex-col min-w-0"
          onClick={drawerOpen ? closeDrawer : undefined}
          style={{ cursor: drawerOpen ? 'pointer' : 'default' }}
        >
          {/* APPROVAL QUEUE */}
          {activeTab === 'queue' && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-4">
                {QUEUE_DOCS.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 text-sm">
                    Nothing pending admin review.
                  </div>
                ) : (
                  QUEUE_DOCS.map(doc => (
                    <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center gap-5 shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0F7' }}>
                        <FileText className="w-5 h-5" style={{ color: '#E20074' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {doc.name}
                          <span className="text-gray-400 ml-2 text-xs">{doc.subject}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Submitted {doc.date}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 flex-shrink-0 ${
                        doc.status === 'Pending Review'
                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                          : 'bg-blue-50 border-blue-300 text-blue-700'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {doc.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ESCALATIONS */}
          {activeTab === 'escalations' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-shrink-0">
                {(['active', 'archive'] as EscSubFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={e => { e.stopPropagation(); setEscFilter(f); setSelectedEsc(null); }}
                    className="px-4 py-1.5 rounded-full border text-sm capitalize transition-colors"
                    style={
                      escFilter === f
                        ? { borderColor: '#E20074', color: '#E20074', backgroundColor: '#FFF0F7' }
                        : { borderColor: '#000', color: '#000', backgroundColor: '#fff' }
                    }
                  >
                    {f === 'active' ? 'Active' : 'Archive'}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden flex">
                {/* Left list */}
                <div className="w-96 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
                  {visibleEscalations.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm px-6">No {escFilter} escalations.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {visibleEscalations.map(esc => (
                        <button
                          key={esc.id}
                          onClick={e => { e.stopPropagation(); setSelectedEsc(esc); }}
                          className={`w-full text-left px-5 py-5 hover:bg-gray-50 transition-colors border-l-4 ${
                            selectedEsc?.id === esc.id ? 'bg-pink-50 border-[#E20074]' : 'border-transparent'
                          }`}
                        >
                          <p className="text-xs text-gray-400 mb-1">From {esc.from} · {esc.timestamp}</p>
                          <p className="text-sm text-gray-900 mb-1">"{esc.question}"</p>
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{esc.reason}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right detail */}
                <div className="flex-1 overflow-y-auto p-8 flex items-start justify-center">
                  {!selectedEsc ? (
                    <div className="w-full max-w-lg h-64 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                      <p className="text-sm text-gray-400">Select an escalation to see full context.</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-xs text-yellow-600 uppercase tracking-wide">Escalation</span>
                        </div>
                        <p className="text-lg text-gray-900 mb-1">"{selectedEsc.question}"</p>
                        <p className="text-xs text-gray-400">From {selectedEsc.from} · {selectedEsc.timestamp}</p>
                      </div>
                      <div className="px-6 py-4 border-b border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Reason for Escalation</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{selectedEsc.reason}</p>
                      </div>
                      <div className="px-6 py-4 border-b border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Full Context</p>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selectedEsc.fullContext}</p>
                      </div>
                      <div className="px-6 py-4 flex gap-3">
                        <button
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white"
                          style={{ backgroundColor: '#E20074' }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark Resolved
                        </button>
                        <button
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs border border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Reply to User
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SME DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-4">
                {SME_DIRECTORY.map(entry => (
                  <div key={entry.subject} className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex items-center gap-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF0F7' }}>
                      <Users className="w-5 h-5" style={{ color: '#E20074' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{entry.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{entry.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[150px]">
                      <p className="text-sm text-gray-900">{entry.sme}</p>
                      <p className="text-xs text-gray-500">{entry.specialty}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{entry.email}</p>
                    </div>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="flex-shrink-0 px-4 py-2 rounded-full text-xs border transition-colors hover:bg-pink-50"
                      style={{ borderColor: '#E20074', color: '#E20074' }}
                    >
                      Request Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Slide-over drawer (pushes content) ─────────────────────────── */}
        <AnimatePresence initial={false}>
          {drawerOpen && (
            <motion.div
              key="usage-drawer"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '35%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="flex-shrink-0 bg-white border-l border-gray-200 overflow-hidden flex flex-col"
              style={{ minWidth: 0 }}
            >
              {/* Drawer inner — fixed layout so content doesn't squish during animation */}
              <div className="w-full h-full flex flex-col overflow-hidden" style={{ minWidth: 340 }}>

                {/* Drawer header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: '#E20074' }} />
                    <span className="text-sm text-gray-900">Company Usage Summary</span>
                  </div>
                  <button onClick={closeDrawer} className="p-1 hover:bg-gray-100 rounded-full">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Drawer body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                  {/* ── Key metrics ── */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Active Users',    value: '1,284', trend: '+12%', up: true  },
                      { label: 'Sessions Today',  value: '342',   trend: '+8%',  up: true  },
                      { label: 'Avg. Chat Length',value: '6.4m',  trend: '-2%',  up: false },
                      { label: 'Resolution Rate', value: '91%',   trend: '+3%',  up: true  },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 rounded-xl px-4 py-4">
                        <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-2xl" style={{ color: '#E20074' }}>{stat.value}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${stat.up ? 'text-green-600' : 'text-red-400'}`}>
                          <TrendingUp className="w-3 h-3" />
                          {stat.trend} vs last week
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Daily active users area chart ── */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Daily Active Users</p>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <DailyActiveUsersChart />
                    </div>
                  </div>

                  {/* ── Topic access bar chart ── */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Most Accessed Topics</p>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <TopicAccessChart />
                    </div>
                  </div>

                  {/* ── Recent activity feed ── */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Recent Activity</p>
                    <div className="space-y-2">
                      {ACTIVITY_FEED.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs"
                            style={{ backgroundColor: '#E20074' }}
                          >
                            {item.user[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-900 truncate">{item.user}</p>
                            <p className="text-xs text-gray-400 leading-snug">{item.action}</p>
                          </div>
                          <span className="text-xs text-gray-300 flex-shrink-0">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Export footer ── */}
                <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#E20074' }}
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Generating PDF…' : 'Export PDF Report'}
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
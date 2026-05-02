import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, X, ChevronRight, Plus, FileText as FileIcon, Image as ImageIcon } from 'lucide-react';

interface UserChatScreenProps {
  onBack: () => void;
}

type AgentKey = 'tea' | 'coffee' | 'car' | 'climbing';

interface Agent {
  key: AgentKey;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

const AGENTS: Record<AgentKey, Agent> = {
  tea:      { key: 'tea',      name: 'Master Chen',  role: 'Milk Tea Expert',      avatar: '🧋', color: '#8B6914' },
  coffee:   { key: 'coffee',   name: 'Barista Aria', role: 'Coffee Specialist',    avatar: '☕', color: '#6F4E37' },
  car:      { key: 'car',      name: 'Mechanic Rex', role: 'Automotive Expert',    avatar: '🚗', color: '#2563EB' },
  climbing: { key: 'climbing', name: 'Climber Zoe',  role: 'Rock Climbing Expert', avatar: '🧗', color: '#16A34A' },
};

const CLARIFY_OPTIONS: { label: string; key: AgentKey }[] = [
  { label: 'Milk Tea 🧋', key: 'tea' },
  { label: 'Coffee ☕',   key: 'coffee' },
  { label: 'Cars 🚗',    key: 'car' },
  { label: 'Rock Climbing 🧗', key: 'climbing' },
];

const topicKeywords: Record<AgentKey, string[]> = {
  tea:      ['tea', 'milk tea', 'boba', 'tapioca', 'bubble', 'matcha', 'oolong', 'jasmine', 'taro'],
  coffee:   ['coffee', 'espresso', 'latte', 'cappuccino', 'roast', 'arabica', 'americano', 'mocha', 'barista', 'pour'],
  car:      ['car', 'vehicle', 'engine', 'drive', 'motor', 'automotive', 'speed', 'tire', 'fuel', 'garage', 'truck'],
  climbing: ['climb', 'rock', 'boulder', 'mountain', 'crag', 'rappel', 'harness', 'route', 'grip', 'summit', 'wall'],
};

const detectAgent = (text: string): AgentKey | null => {
  const lower = text.toLowerCase();
  for (const [key, kws] of Object.entries(topicKeywords)) {
    if (kws.some(kw => lower.includes(kw))) return key as AgentKey;
  }
  return null;
};

const agentReplies: Record<AgentKey, string[]> = {
  tea: [
    `Ah, a question about tea… *takes a slow breath*. Every cup tells a story. In the art of milk tea, balance is everything — the strength of the brew, the sweetness of the syrup, the dance of the tapioca pearls. What you're truly seeking is harmony in a glass.`,
    `The ancient tea masters would say: water is the mother, leaves are the soul. With milk tea, we add a third element — connection. Each sip is meant to slow time. Let me guide you deeper into this world.`,
    `There is wisdom in your question. Milk tea is not merely a drink — it is a ritual. The temperature, the steep time, the choice of milk — each decision shapes an experience as unique as the one who holds the cup.`,
  ],
  coffee: [
    `Now THAT'S what I'm talking about! Most people don't realize that grind size alone can completely transform a cup. We're talking the difference between a muddy extraction and a crisp, vibrant shot that sings with clarity.`,
    `Oh, you've come to the right place! I've spent years perfecting the pour-over — 93°C water, 30-second bloom, precise ratio. Coffee is science wrapped in pleasure, and I am HERE for it every single morning.`,
    `Real talk? The specialty coffee scene has been sitting on so many hidden flavor profiles. Ethiopian single-origin can taste like blueberries and jasmine with zero additives. That's just what happens when you honor the process.`,
  ],
  car: [
    `Great question! Here's what people always overlook — fundamentals. Whether it's a '69 Mustang or a 2024 EV, the physics don't lie. Torque, traction, and weight distribution. Master those three and you understand any machine on four wheels.`,
    `I've been under the hood of everything from a beat-up Civic to a Ferrari track car. You know what they all share? They reward you when you respect them. Cars are mechanical poetry — every part has a purpose.`,
    `Forget the brochure. Real automotive knowledge comes from miles driven and hands dirty with grease. Let me break it down the way a mechanic actually sees it, no fluff.`,
  ],
  climbing: [
    `Stoked you asked! Rock climbing is as much mental as it is physical — maybe more. When you're 30 feet up a 5.11 route, your brain is your most important piece of gear. Breathe, trust your feet, and read the rock like a puzzle.`,
    `First things first — safety culture in climbing is everything. We look out for each other out there. But beyond the gear checks and anchors, climbing teaches you to be comfortable being uncomfortable. That's a life skill.`,
    `The rock doesn't lie. You either make the move or you don't — but here's the beautiful part: you can always try again. Every fall is data. Every send is earned. I still get butterflies on a new route after 12 years.`,
  ],
};

type MsgType = 'normal' | 'routing' | 'clarifying';

interface Attachment {
  name: string;
  kind: 'image' | 'document';
  dataUrl: string;     // object URL for images, empty string for docs
  mimeType: string;
}

interface Message {
  id: number;
  sender: 'thoth' | 'user' | 'agent';
  text: string;
  agentKey?: AgentKey;
  type?: MsgType;
  options?: { label: string; key: AgentKey }[];
  attachment?: Attachment;
}

type ConvState = 'idle' | 'routing' | 'clarifying';

const insightMap: Record<AgentKey, string> = {
  tea:      'Explored the art of balance, ritual, and harmony in milk tea culture.',
  coffee:   'Discussed precision extraction, bloom technique, and single-origin flavor profiles.',
  car:      'Covered fundamentals of automotive mechanics, torque, and driving dynamics.',
  climbing: 'Learned about mental resilience, safety culture, and route-reading technique.',
};

export function UserChatScreen({ onBack }: UserChatScreenProps) {
  // ── Onboarding state ──────────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [nameField,    setNameField]    = useState('');
  const [contactField, setContactField] = useState('');
  const [nameError,    setNameError]    = useState('');
  const [contactError, setContactError] = useState('');

  // ── Chat state ────────────────────────────────────────────────────
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [inputValue,  setInputValue]  = useState('');
  const [convState,   setConvState]   = useState<ConvState>('idle');
  const [activeAgent, setActiveAgent] = useState<AgentKey | null>(null);
  const [agentTurns,  setAgentTurns]  = useState<Partial<Record<AgentKey, number>>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [userName,    setUserName]    = useState('');

  // ── File attachment state ─────────────────────────────────────────
  const [pendingFile, setPendingFile] = useState<Attachment | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  const idRef     = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nextId = () => { idRef.current += 1; return idRef.current; };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, convState]);

  // ── File picker handler ───────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const reader = new FileReader();
      reader.onload = ev => {
        setPendingFile({ name: file.name, kind: 'image', dataUrl: ev.target?.result as string, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    } else {
      setPendingFile({ name: file.name, kind: 'document', dataUrl: '', mimeType: file.type });
    }
    // reset so same file can be re-selected
    e.target.value = '';
  };

  // ── Onboarding submit ─────────────────────────────────────────────
  const handleStartChat = () => {
    let valid = true;
    if (!nameField.trim())    { setNameError('Please enter your name.');            valid = false; }
    else                       { setNameError(''); }
    if (!contactField.trim()) { setContactError('Please enter an email or phone.'); valid = false; }
    else                       { setContactError(''); }
    if (!valid) return;

    const name    = nameField.trim();
    const contact = contactField.trim();
    setUserName(name);
    setShowOnboarding(false);

    // Build opening conversation that mirrors the form
    const opening: Message[] = [
      { id: nextId(), sender: 'thoth', type: 'normal',
        text: `What's your name?` },
      { id: nextId(), sender: 'user',
        text: name },
      { id: nextId(), sender: 'thoth', type: 'normal',
        text: `How can we reach you?` },
      { id: nextId(), sender: 'user',
        text: contact },
      { id: nextId(), sender: 'thoth', type: 'normal',
        text: `Great to meet you, ${name}! I'm Thoth, your AI assistant. I can connect you with expert agents in Milk Tea, Coffee, Cars, and Rock Climbing. What would you like to explore today?` },
    ];
    setMessages(opening);
  };

  // ── Chat helpers ─────────────────────────────────────────────────
  const push = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: nextId() }]);

  const routeToAgent = (agentKey: AgentKey) => {
    const agent = AGENTS[agentKey];
    setActiveAgent(agentKey);
    setConvState('routing');
    push({ sender: 'thoth', type: 'routing', text: `Routing you to ${agent.name}, our ${agent.role}…` });
    setTimeout(() => {
      const replies = agentReplies[agentKey];
      push({ sender: 'agent', agentKey, type: 'normal', text: replies[Math.floor(Math.random() * replies.length)] });
      setAgentTurns(prev => ({ ...prev, [agentKey]: (prev[agentKey] || 0) + 1 }));
      setConvState('idle');
    }, 1800);
  };

  const sendMessage = () => {
    if ((!inputValue.trim() && !pendingFile) || convState !== 'idle') return;
    const text = inputValue.trim();
    const attachment = pendingFile ?? undefined;
    setInputValue('');
    setPendingFile(null);
    push({ sender: 'user', text: text || (attachment ? `[Attached: ${attachment.name}]` : ''), attachment });
    const detected = detectAgent(text);
    if (detected) {
      routeToAgent(detected);
    } else if (text) {
      setConvState('clarifying');
      setTimeout(() => {
        push({
          sender: 'thoth', type: 'clarifying',
          text: "I'd love to help! Your question could relate to a few different topics. Which area would you like to explore?",
          options: CLARIFY_OPTIONS,
        });
      }, 700);
    } else {
      // file-only message — Thoth acknowledges
      setTimeout(() => {
        push({ sender: 'thoth', type: 'normal', text: `Thanks for sharing that file! I've received "${attachment?.name}". How can I help you with it?` });
      }, 700);
    }
  };

  const handleClarify = (opt: { label: string; key: AgentKey }) => {
    push({ sender: 'user', text: opt.label });
    setConvState('idle');
    routeToAgent(opt.key);
  };

  const userMessages  = messages.filter(m => m.sender === 'user');
  const agentMessages = messages.filter(m => m.sender === 'agent');
  const topicsDiscussed = [...new Set(agentMessages.map(m => m.agentKey).filter(Boolean))] as AgentKey[];

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* ── Onboarding Modal ────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-8 pt-8 pb-6 text-center">
              {/* Back button */}
              <div className="flex items-start mb-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ backgroundColor: '#E20074' }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl text-gray-900 mb-1">Welcome to Thoth</h2>
              <p className="text-sm text-gray-400">
                Tell us a little about yourself before we begin.
              </p>
            </div>

            {/* Fields */}
            <div className="px-8 pb-2 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={nameField}
                  onChange={e => { setNameField(e.target.value); setNameError(''); }}
                  onKeyPress={e => e.key === 'Enter' && handleStartChat()}
                  placeholder="e.g. Alex"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                    nameError ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-[#E20074]'
                  }`}
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Contact Info</label>
                <input
                  type="text"
                  value={contactField}
                  onChange={e => { setContactField(e.target.value); setContactError(''); }}
                  onKeyPress={e => e.key === 'Enter' && handleStartChat()}
                  placeholder="Email or phone number"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                    contactError ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-[#E20074]'
                  }`}
                />
                {contactError && <p className="text-xs text-red-500 mt-1">{contactError}</p>}
              </div>
            </div>

            {/* Start Chat button */}
            <div className="px-8 py-6">
              <button
                onClick={handleStartChat}
                className="w-full py-3.5 rounded-full text-white text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E20074' }}
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="px-6 py-4 flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" style={{ color: '#E20074' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg" style={{ color: '#E20074' }}>Chat with Thoth</h1>
            <p className="text-sm text-gray-500">
              {activeAgent ? `Connected · ${AGENTS[activeAgent].name}` : userName ? `Hi, ${userName}` : 'AI Assistant'}
            </p>
          </div>
          
        </div>
      </div>

      {/* ── Body: sidebar + chat ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col p-5 space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Expert Agents</p>
          {Object.values(AGENTS).map(agent => (
            <div
              key={agent.key}
              className={`flex items-center space-x-3 rounded-xl px-3 py-3 transition-colors ${
                activeAgent === agent.key ? 'bg-pink-50 border border-pink-200' : 'bg-gray-50'
              }`}
            >
              
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ color: '#E20074' }}>{agent.name}</p>
                <p className="text-xs text-gray-400 truncate">{agent.role}</p>
              </div>
              {activeAgent === agent.key && (
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
              )}
            </div>
          ))}

          <div className="flex-1" />

          <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-4">
            <p className="text-gray-500">Session stats</p>
            <p>Questions asked: <span style={{ color: '#E20074' }}>{userMessages.length}</span></p>
            <p>Agent responses: <span style={{ color: '#E20074' }}>{agentMessages.length}</span></p>
            <p>Topics: <span style={{ color: '#E20074' }}>{topicsDiscussed.length}</span></p>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div key={message.id}>
                {message.sender === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-[60%] rounded-2xl px-4 py-3 bg-[#E20074] text-white">
                      {/* Attachment preview inside bubble */}
                      {message.attachment && (
                        <div className="mb-2">
                          {message.attachment.kind === 'image' ? (
                            <img
                              src={message.attachment.dataUrl}
                              alt={message.attachment.name}
                              className="w-full rounded-xl object-cover max-h-48"
                            />
                          ) : (
                            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                              <FileIcon className="w-4 h-4 flex-shrink-0 text-white" />
                              <span className="text-xs text-white truncate">{message.attachment.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.text && <p className="text-sm leading-relaxed">{message.text}</p>}
                    </div>
                  </div>
                )}

                {message.sender === 'thoth' && message.type !== 'clarifying' && (
                  <div className="flex justify-start">
                    <div className={`max-w-[65%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.type === 'routing' ? 'bg-pink-50 border border-pink-200' : 'bg-white'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <Sparkles className="w-4 h-4" style={{ color: '#E20074' }} />
                        <span className="text-xs" style={{ color: '#E20074' }}>
                          {message.type === 'routing' ? 'Thoth · Routing' : 'Thoth AI'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-800">{message.text}</p>
                    </div>
                  </div>
                )}

                {message.sender === 'thoth' && message.type === 'clarifying' && (
                  <div className="flex justify-start">
                    <div className="max-w-[65%] rounded-2xl px-4 py-3 bg-white shadow-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <Sparkles className="w-4 h-4" style={{ color: '#E20074' }} />
                        <span className="text-xs" style={{ color: '#E20074' }}>Thoth AI · Clarifying</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-800 mb-3">{message.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {message.options?.map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => convState === 'clarifying' && handleClarify(opt)}
                            className="px-3 py-1.5 rounded-full text-xs border border-[#E20074] text-[#E20074] hover:bg-[#E20074] hover:text-white transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {message.sender === 'agent' && message.agentKey && (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[65%] rounded-2xl px-4 py-3 bg-white shadow-sm border-l-4"
                      style={{ borderColor: AGENTS[message.agentKey].color }}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-base">{AGENTS[message.agentKey].avatar}</span>
                        <span className="text-xs" style={{ color: AGENTS[message.agentKey].color }}>
                          {AGENTS[message.agentKey].name}
                        </span>
                        <span className="text-xs text-gray-400">· {AGENTS[message.agentKey].role}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-800">{message.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {convState === 'routing' && (
              <div className="flex justify-start">
                <div className="bg-pink-50 border border-pink-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                    <span className="text-xs text-pink-500">Connecting to agent…</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">

            {/* ── Pending file preview ── */}
            {pendingFile && (
              <div className="mb-3 flex items-center gap-2">
                {pendingFile.kind === 'image' ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={pendingFile.dataUrl}
                      alt={pendingFile.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                    />
                    <button
                      onClick={() => setPendingFile(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 pr-8 max-w-xs">
                    <FileIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#E20074' }} />
                    <span className="text-xs text-gray-700 truncate">{pendingFile.name}</span>
                    <button
                      onClick={() => setPendingFile(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
                disabled={convState !== 'idle' || showOnboarding}
              />

              {/* "+" attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={convState !== 'idle' || showOnboarding}
                title="Attach image or document"
                className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors disabled:opacity-40"
                style={{ borderColor: '#E20074', color: '#E20074' }}
              >
                <Plus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                placeholder={convState === 'clarifying' ? 'Choose a topic above…' : 'Ask me anything…'}
                disabled={convState !== 'idle' || showOnboarding}
                className="flex-1 min-w-0 border border-gray-300 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[#E20074] disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={(convState !== 'idle' || showOnboarding) && !pendingFile}
                className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"
                style={{ backgroundColor: '#E20074' }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setShowSummary(true)}
                className="h-11 px-5 rounded-full flex-shrink-0 flex items-center justify-center bg-black text-white text-sm"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Report Modal ─────────────────────────────────────── */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" style={{ color: '#E20074' }} />
                <h2 className="text-lg" style={{ color: '#E20074' }}>Conversation Report</h2>
              </div>
              <button onClick={() => setShowSummary(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {userName && (
              <div className="bg-pink-50 rounded-xl px-4 py-3 mb-5 text-sm text-gray-600">
                Session for <span className="font-medium" style={{ color: '#E20074' }}>{userName}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: userMessages.length,   label: 'Questions' },
                { value: agentMessages.length,  label: 'Responses' },
                { value: topicsDiscussed.length, label: 'Topics' },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl" style={{ color: '#E20074' }}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {topicsDiscussed.length > 0 ? (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Agents Consulted</p>
                <div className="space-y-2 mb-6">
                  {topicsDiscussed.map(key => {
                    const agent = AGENTS[key];
                    const count = agentTurns[key] || 0;
                    return (
                      <div key={key} className="flex items-center space-x-3 bg-gray-50 rounded-xl p-3">
                        <span className="text-2xl">{agent.avatar}</span>
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: agent.color }}>{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.role} · {count} response{count !== 1 ? 's' : ''}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Key Insights</p>
                <div className="space-y-2 mb-6">
                  {topicsDiscussed.map(key => (
                    <div key={key} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: AGENTS[key].color }} />
                      <p className="text-xs text-gray-600 leading-relaxed">{insightMap[key]}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 mb-4">
                <p className="text-sm text-gray-400">No agent interactions yet.</p>
              </div>
            )}

            <button
              onClick={() => { setShowSummary(false); onBack(); }}
              className="w-full py-3 rounded-full text-white text-sm"
              style={{ backgroundColor: '#E20074' }}
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
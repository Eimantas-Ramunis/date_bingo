import { useState, useEffect } from 'react';
import api from '../api';
import { useTheme } from '../theme';
import {
  Calendar, Shuffle, CheckCircle, Plus, Sparkles, LogOut,
  LayoutGrid, History, Trash2, Edit, X, ArrowRight, ArrowLeft,
  KeyRound, Settings2, ImagePlus, Moon, Sun, ChevronDown, ChevronUp
} from 'lucide-react';

const TABS = [
  { id: 'plan', label: 'Plan', icon: Calendar },
  { id: 'deck', label: 'Deck', icon: Shuffle },
  { id: 'bingo', label: 'Bingo', icon: LayoutGrid },
  { id: 'history', label: 'History', icon: History },
];

const AI_THEMES = [
  { id: 'cozy-home', label: 'Cozy at Home' },
  { id: 'outdoors-daylight', label: 'Outdoors & Daylight' },
  { id: 'food-drink', label: 'Food & Drink' },
  { id: 'creative-make', label: 'Creative / Make' },
  { id: 'playful-games', label: 'Playful Games' },
  { id: 'culture-art', label: 'Culture & Art' },
  { id: 'movement-active', label: 'Movement / Active' },
  { id: 'nostalgia', label: 'Nostalgia' },
  { id: 'surprise-mystery', label: 'Surprise / Mystery' },
  { id: 'slow-relax', label: 'Slow / Relax' },
  { id: 'micro-adventure', label: 'Micro Adventure' },
  { id: 'sunrise-sunset', label: 'Sunrise / Sunset' },
  { id: 'rainy-day', label: 'Rainy Day' },
  { id: 'budget-friendly', label: 'Budget Friendly' },
  { id: 'luxury-treat', label: 'Luxury Treat' },
  { id: 'memory-lane', label: 'Memory Lane' },
  { id: 'nature-escape', label: 'Nature Escape' },
  { id: 'social-light', label: 'Social Light' }
];

const PREP_COLUMNS = [
  { id: 'to_do', label: 'To do' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' }
];

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('plan');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);

  // Load plan on mount
  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = () => {
    api.get('/planning/current').then(res => setCurrentPlan(res.data));
  };

  const logout = async () => {
    await api.post('/auth/logout');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-stone-900 dark:bg-black text-stone-400 w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-white font-serif text-xl font-bold">DateBingo</h1>
          <div className="text-xs mt-1 text-stone-500">Admin Console</div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-stone-800 text-white' : 'hover:bg-stone-800 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800 space-y-3">
          <button onClick={toggleTheme} className="flex items-center gap-2 text-sm hover:text-white">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => setShowAiSettingsModal(true)} className="flex items-center gap-2 text-sm hover:text-white">
            <Settings2 size={16} /> AI Settings
          </button>
          <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-2 text-sm hover:text-white">
            <KeyRound size={16} /> Change Password
          </button>
          <button onClick={logout} className="flex items-center gap-2 text-sm hover:text-white">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'plan' && <PlanTab currentPlan={currentPlan} refresh={fetchCurrentPlan} />}
        {activeTab === 'deck' && <DeckTab />}
        {activeTab === 'bingo' && <BingoTab />}
        {activeTab === 'history' && <HistoryTab />}
      </main>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showAiSettingsModal && <AiSettingsModal onClose={() => setShowAiSettingsModal(false)} />}
    </div>
  );
}

// --- TAB COMPONENTS ---

function PlanTab({ currentPlan, refresh }) {
  const [suggestions, setSuggestions] = useState([]);
  const [allIdeas, setAllIdeas] = useState([]);
  const [selectingIdea, setSelectingIdea] = useState(null);
  const [manualQuery, setManualQuery] = useState('');
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  const suggest = async () => {
    setLoading(true);
    const res = await api.get('/planning/suggest');
    setSuggestions(res.data);
    setLoading(false);
  };

  const loadAllIdeas = async () => {
    setManualLoading(true);
    try {
      const res = await api.get('/planning/ideas');
      setAllIdeas(res.data);
    } catch (e) {
      setAllIdeas([]);
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPlan) {
      loadAllIdeas();
    }
  }, [currentPlan]);

  const handleSelect = (idea) => {
    setSelectingIdea(idea);
  };

  const filteredIdeas = allIdeas.filter((idea) => {
    const query = manualQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      idea.title.toLowerCase().includes(query) ||
      idea.shortDescription.toLowerCase().includes(query)
    );
  });

  if (selectingIdea) {
    return <PlanningForm idea={selectingIdea} onCancel={() => setSelectingIdea(null)} onSuccess={() => { setSelectingIdea(null); refresh(); }} />;
  }

  if (currentPlan) {
    return <ActivePlanView plan={currentPlan} refresh={refresh} />;
  }

  return (
    <div className="max-w-[1500px] w-full mx-auto">
      <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">Plan Next Date</h2>
      
      {suggestions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="mb-4">No active plan. Time to schedule something?</div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={suggest}
              disabled={loading}
              className="bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 disabled:opacity-50"
            >
              {loading ? 'Thinking...' : 'Suggest 3 Ideas'}
            </button>
            <button
              onClick={() => setShowManualPicker(true)}
              className="bg-white border border-stone-300 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-50"
            >
              Pick Specific Idea
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-stone-500">Suggestions</h3>
             <div className="flex gap-4">
               <button onClick={() => setShowManualPicker(true)} className="text-sm text-stone-400 hover:text-stone-800">
                 Pick specific
               </button>
               <button onClick={suggest} className="text-sm text-stone-400 hover:text-stone-800 flex items-center gap-1">
                 <Shuffle size={14} /> Reshuffle
               </button>
             </div>
           </div>
           <div className="grid md:grid-cols-3 gap-6">
             {suggestions.map(idea => (
               <div key={idea.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2">{idea.title}</h4>
                    <p className="text-sm text-stone-600 mb-4">{idea.shortDescription}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {idea.vibes.slice(0,2).map(v => <span key={v} className="bg-stone-100 text-xs px-2 py-1 rounded">{v}</span>)}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelect(idea)}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded font-medium mt-4"
                  >
                    Select This
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {showManualPicker && (
        <div className="fixed inset-0 bg-stone-900/50 z-40 p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">Pick Specific Idea</h3>
              <button onClick={() => setShowManualPicker(false)} className="text-stone-500 hover:text-stone-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <input
                className="w-full border rounded-lg p-2 mb-4"
                placeholder="Search by title or description"
                value={manualQuery}
                onChange={e => setManualQuery(e.target.value)}
              />
              {manualLoading ? (
                <div className="text-sm text-stone-500 py-8 text-center">Loading ideas...</div>
              ) : (
                <div className="max-h-[55vh] overflow-auto space-y-2">
                  {filteredIdeas.map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => {
                        handleSelect(idea);
                        setShowManualPicker(false);
                      }}
                      className="w-full text-left border rounded-lg p-3 hover:bg-stone-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-stone-800">{idea.title}</div>
                          <div className="text-xs text-stone-500 line-clamp-2">{idea.shortDescription}</div>
                        </div>
                        <div className="text-right text-xs">
                          {idea.isCoolingDown ? (
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              Cooldown {idea.cooldownRemainingDays}d
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredIdeas.length === 0 && (
                    <div className="text-sm text-stone-500 py-8 text-center">No ideas found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanningForm({ idea, onCancel, onSuccess }) {
  const [form, setForm] = useState({
    hintTeaser: '',
    hintStartTime: '19:00',
    hintDressCode: 'Smart Casual',
    hintDuration: idea.duration
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHintPreview, setShowHintPreview] = useState(false);
  const [showRevealPreview, setShowRevealPreview] = useState(false);

  const generateTeaser = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/rewrite-teaser', { ideaId: idea.id });
      setForm(prev => ({ ...prev, hintTeaser: res.data.teaser }));
    } catch(e) { alert('AI Error'); }
    setAiLoading(false);
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/planning/select', { ideaId: idea.id, ...form });
      onSuccess();
    } catch(e) { alert(e.response?.data?.error || 'Error'); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6">Finalize Plan: {idea.title}</h2>
      
      <div className="space-y-4 mb-6">
        <div>
           <label className="block text-sm font-medium mb-1">Teaser (Lithuanian) <span className="text-red-500">*</span></label>
           <div className="flex gap-2">
             <input 
               className="flex-1 border p-2 rounded" 
               value={form.hintTeaser} 
               onChange={e => setForm({...form, hintTeaser: e.target.value})}
               placeholder="Pasiruošk..."
             />
             <button 
               onClick={generateTeaser} disabled={aiLoading}
               className="bg-purple-100 text-purple-700 px-3 rounded hover:bg-purple-200"
             >
               {aiLoading ? '...' : <Sparkles size={18} />}
             </button>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input className="w-full border p-2 rounded" value={form.hintStartTime} onChange={e => setForm({...form, hintStartTime: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dress Code</label>
            <input className="w-full border p-2 rounded" value={form.hintDressCode} onChange={e => setForm({...form, hintDressCode: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-stone-50">Cancel</button>
        <button onClick={submit} disabled={loading} className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700">Confirm Plan</button>
        <button onClick={() => setShowHintPreview(!showHintPreview)} className="px-4 py-2 border rounded hover:bg-stone-50">
          Peržiūrėti užuominą
        </button>
        <button onClick={() => setShowRevealPreview(!showRevealPreview)} className="px-4 py-2 border rounded hover:bg-stone-50">
          Peržiūrėti atskleidimą
        </button>
      </div>

      {(showHintPreview || showRevealPreview) && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {showHintPreview && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="bg-stone-800 text-white text-center rounded-lg py-3 mb-4">
                <h3 className="font-serif text-lg font-bold">Rytojaus Pasimatymas</h3>
                <p className="text-stone-300 text-xs">Maža užuomina...</p>
              </div>
              <div className="text-center mb-4">
                <p className="italic text-stone-700">"{form.hintTeaser || '...'}"</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-2 border">
                  <div className="text-xs text-stone-400">Pradžia</div>
                  <div className="font-semibold">{form.hintStartTime}</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-xs text-stone-400">Apranga</div>
                  <div className="font-semibold">{form.hintDressCode}</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <span className="text-xs text-stone-500 bg-white border rounded-full px-3 py-1">{form.hintDuration}</span>
              </div>
            </div>
          )}

          {showRevealPreview && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              {idea.image ? (
                <div className="h-32 bg-stone-200">
                  <img src={`/uploads/${idea.image}`} alt={idea.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-2 bg-stone-800" />
              )}
              <div className="p-4">
                <h3 className="font-serif text-xl font-bold text-stone-900">{idea.title}</h3>
                <p className="text-sm text-stone-600 mb-3">{idea.shortDescription}</p>
                <div className="flex gap-4 text-xs text-stone-500">
                  <div>{idea.duration}</div>
                  <div>{idea.radius}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivePlanView({ plan, refresh }) {
  const [links, setLinks] = useState({ hint: '', reveal: '' });
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [previewLinks, setPreviewLinks] = useState({ hint: '', reveal: '' });
  const [prepItemSize, setPrepItemSize] = useState(() => {
    try {
      const saved = window.localStorage.getItem('datebingo.prepItemSize');
      return saved === 'sm' || saved === 'lg' ? saved : 'md';
    } catch (err) {
      return 'md';
    }
  });
  const [prepBoards, setPrepBoards] = useState({
    A: plan.planAPrepBoard || [],
    B: plan.planBPrepBoard || []
  });
  const [updatingPrepKey, setUpdatingPrepKey] = useState('');

  // ✅ Robust clipboard helper:
  // - Works on HTTPS + localhost with navigator.clipboard
  // - Falls back to execCommand for http://LAN_IP and older browsers
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      // Intentionally swallow and fall back
      console.warn('navigator.clipboard.writeText failed, falling back:', err);
    }

    // Fallback: execCommand('copy')
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);

      ta.focus();
      ta.select();

      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  const generateLink = async (type) => {
    try {
      const res = await api.post('/planning/token', { plannedDateId: plan.id, type });
      const url = `${window.location.origin}/r?token=${res.data.token}`;

      setLinks((prev) => ({ ...prev, [type.toLowerCase()]: url }));

      const copied = await copyToClipboard(url);
      alert(copied ? 'Link copied to clipboard!' : 'Could not auto-copy. Link is shown on screen.');
    } catch (e) {
      console.error(e);
      alert('Failed to generate link');
    }
  };

  const loadPreviews = async () => {
    try {
      const [hintRes, revealRes] = await Promise.all([
        api.post('/planning/preview-token', { plannedDateId: plan.id, type: 'HINT' }),
        api.post('/planning/preview-token', { plannedDateId: plan.id, type: 'REVEAL' }),
      ]);

      setPreviewLinks({
        hint: `${window.location.origin}/r?token=${hintRes.data.token}`,
        reveal: `${window.location.origin}/r?token=${revealRes.data.token}`,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to load previews');
    }
  };

  useEffect(() => {
    loadPreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  useEffect(() => {
    setPrepBoards({
      A: Array.isArray(plan.planAPrepBoard) ? plan.planAPrepBoard : [],
      B: Array.isArray(plan.planBPrepBoard) ? plan.planBPrepBoard : []
    });
  }, [plan.planAPrepBoard, plan.planBPrepBoard, plan.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem('datebingo.prepItemSize', prepItemSize);
    } catch (err) {
      // Ignore storage failures
    }
  }, [prepItemSize]);

  const cancelPlan = async () => {
    if (!confirm('Cancel this plan? Links will stop working.')) return;
    setCancelling(true);
    try {
      await api.delete(`/planning/${plan.id}`);
      refresh();
    } catch (e) {
      console.error(e);
      alert('Failed to cancel plan');
    } finally {
      setCancelling(false);
    }
  };

  const updatePrepStatus = async (planType, itemId, status) => {
    setUpdatingPrepKey(`${planType}:${itemId}`);
    try {
      const res = await api.patch(`/planning/${plan.id}/prep-item-status`, {
        planType,
        itemId,
        status
      });
      setPrepBoards({
        A: res.data.planAPrepBoard || [],
        B: res.data.planBPrepBoard || []
      });
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || 'Failed to update prep item status');
    } finally {
      setUpdatingPrepKey('');
    }
  };

  if (completing)
    return <CompleteForm plan={plan} onCancel={() => setCompleting(false)} onSuccess={refresh} />;

  return (
    <div className="max-w-[1500px] w-full mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                plan.status === 'VETOED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Status: {plan.status}
            </span>
            {plan.planBActive && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full uppercase font-bold">
                Plan B Active
              </span>
            )}
          </div>
          <h2 className="text-3xl font-serif font-bold">{plan.idea.title}</h2>
          {plan.status === 'VETOED' && plan.vetoReason && (
            <div className="mt-2 text-red-600 font-medium">
              Veto Reason: <span className="italic">"{plan.vetoReason}"</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded px-2 py-1">
            <span className="text-xs text-stone-500">Prep Item Size</span>
            <select
              value={prepItemSize}
              onChange={(e) => setPrepItemSize(e.target.value)}
              className="text-xs border border-stone-300 rounded px-2 py-1 bg-white"
            >
              <option value="sm">Compact</option>
              <option value="md">Comfortable</option>
              <option value="lg">Spacious</option>
            </select>
          </div>
          <button
            onClick={cancelPlan}
            disabled={cancelling}
            className="bg-stone-200 text-stone-700 px-4 py-2 rounded hover:bg-stone-300"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Plan'}
          </button>
          <button
            onClick={() => setCompleting(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2"
          >
            <CheckCircle size={18} /> Mark Done
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-5">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
            <h3 className="font-bold border-b pb-2">Links</h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Hint Link</div>
                <div className="text-xs text-stone-500">Send day before</div>
              </div>
              <button
                onClick={() => generateLink('HINT')}
                className="text-sm bg-stone-100 px-3 py-1 rounded hover:bg-stone-200"
              >
                Generate & Copy
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Reveal Link</div>
                <div className="text-xs text-stone-500">Send day of</div>
              </div>
              <button
                onClick={() => generateLink('REVEAL')}
                className="text-sm bg-stone-100 px-3 py-1 rounded hover:bg-stone-200"
              >
                Generate & Copy
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Bingo Link</div>
                <div className="text-xs text-stone-500">Share board</div>
              </div>
              <button
                onClick={() => generateLink('BINGO')}
                className="text-sm bg-stone-100 px-3 py-1 rounded hover:bg-stone-200"
              >
                Generate & Copy
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold">Preview Cards</h3>
              <button onClick={loadPreviews} className="text-xs text-stone-400 hover:text-stone-700">
                Refresh
              </button>
            </div>
            <div className="grid gap-4">
              <div className="border rounded-lg overflow-hidden">
                {previewLinks.hint ? (
                  <iframe title="Hint preview" src={previewLinks.hint} className="w-full h-72" />
                ) : (
                  <div className="p-4 text-sm text-stone-400">Hint preview loading...</div>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                {previewLinks.reveal ? (
                  <iframe title="Reveal preview" src={previewLinks.reveal} className="w-full h-72" />
                ) : (
                  <div className="p-4 text-sm text-stone-400">Reveal preview loading...</div>
                )}
              </div>
            </div>
          </div>

          {plan.planBActive && (
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="font-bold text-yellow-900 border-b border-yellow-200 pb-2 mb-3">
                Plan B Details
              </h3>
              <h4 className="font-bold text-lg">{plan.planBTitle}</h4>
              <p className="text-sm text-stone-700 mb-2">{plan.planBDesc}</p>
              <ul className="list-disc pl-4 text-sm text-stone-600">
                {plan.planBSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6 xl:col-span-7">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-fit">
            <h3 className="font-bold border-b pb-2 mb-4">Plan A Details</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3">
                <span className="text-stone-500">Teaser</span>{' '}
                <span className="col-span-2 italic">{plan.hintTeaser}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-stone-500">Time</span>{' '}
                <span className="col-span-2">{plan.hintStartTime}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-stone-500">Dress</span>{' '}
                <span className="col-span-2">{plan.hintDressCode}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-stone-500">Duration</span>{' '}
                <span className="col-span-2">{plan.hintDuration}</span>
              </div>
            </div>
          </div>

          <PrepBoard
            title="Plan A Preparation"
            items={prepBoards.A}
            planType="A"
            highlighted={!plan.planBActive}
            itemSize={prepItemSize}
            updatingPrepKey={updatingPrepKey}
            onStatusChange={updatePrepStatus}
          />
          <PrepBoard
            title="Plan B Preparation"
            items={prepBoards.B}
            planType="B"
            highlighted={plan.planBActive}
            itemSize={prepItemSize}
            updatingPrepKey={updatingPrepKey}
            onStatusChange={updatePrepStatus}
          />
        </div>
      </div>
    </div>
  );
}

function PrepBoard({ title, items, planType, highlighted, itemSize, updatingPrepKey, onStatusChange }) {
  const safeItems = Array.isArray(items) ? items : [];
  const sizeClasses = {
    sm: {
      wrapper: 'p-4',
      column: 'p-2',
      item: 'p-1.5',
      text: 'text-xs',
      button: 'px-1.5 py-0.5 text-[10px]'
    },
    md: {
      wrapper: 'p-5',
      column: 'p-3',
      item: 'p-2',
      text: 'text-sm',
      button: 'px-2 py-1 text-[11px]'
    },
    lg: {
      wrapper: 'p-6',
      column: 'p-4',
      item: 'p-3',
      text: 'text-base',
      button: 'px-2.5 py-1.5 text-xs'
    }
  };
  const classes = sizeClasses[itemSize] || sizeClasses.md;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${classes.wrapper} ${highlighted ? 'border-amber-300 ring-2 ring-amber-100' : 'border-stone-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{title}</h3>
        <span className="text-xs text-stone-500">{safeItems.length} items</span>
      </div>

      {safeItems.length === 0 ? (
        <div className="text-sm text-stone-500 bg-stone-50 border border-dashed border-stone-200 rounded-lg p-3">
          No preparation items yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {PREP_COLUMNS.map((column) => {
            const columnItems = safeItems.filter((item) => item?.status === column.id);
            return (
              <div key={column.id} className={`bg-stone-50 rounded-lg border border-stone-200 space-y-2 ${classes.column}`}>
                <div className="font-semibold text-sm text-stone-700">{column.label}</div>
                {columnItems.length === 0 && (
                  <div className="text-xs text-stone-400">No items</div>
                )}
                {columnItems.map((item) => {
                  const currentKey = `${planType}:${item.id}`;
                  const isUpdating = updatingPrepKey === currentKey;
                  return (
                    <div key={item.id} className={`bg-white border border-stone-200 rounded space-y-2 ${classes.item}`}>
                      <div className={`${classes.text} text-stone-700`}>{item.text}</div>
                      <div className="flex gap-1">
                        {PREP_COLUMNS.map((target) => (
                          <button
                            key={target.id}
                            onClick={() => onStatusChange(planType, item.id, target.id)}
                            disabled={isUpdating || target.id === item.status}
                            className={`${classes.button} rounded border ${
                              item.status === target.id
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                            } disabled:opacity-50`}
                          >
                            {target.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompleteForm({ plan, onCancel, onSuccess }) {
  const [form, setForm] = useState({
    touchRitual: false, phonesAway: false, laughed: false, honestSentence: false, newPlace: false,
    notes: '', rating: 3
  });

  const submit = async () => {
    await api.post(`/planning/${plan.id}/done`, form);
    onSuccess();
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Wrap Up</h2>
      <div className="space-y-3 mb-6">
        {Object.keys(form).filter(k => typeof form[k] === 'boolean').map(key => (
          <label key={key} className="flex items-center gap-3 p-2 border rounded cursor-pointer hover:bg-stone-50">
             <input type="checkbox" checked={form[key]} onChange={e => setForm({...form, [key]: e.target.checked})} />
             <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
          </label>
        ))}
        <textarea 
          className="w-full border p-2 rounded" placeholder="Notes..." 
          value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} 
        />
        <div className="flex items-center gap-2">
           <span>Rating:</span>
           <input type="number" min="1" max="5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} className="border p-1 w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 border rounded">Cancel</button>
        <button onClick={submit} className="flex-1 py-2 bg-emerald-600 text-white rounded">Finish</button>
      </div>
    </div>
  );
}

function DeckTab() {
  const [ideas, setIdeas] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [mediaIdea, setMediaIdea] = useState(null);
  const [expandedIdeaId, setExpandedIdeaId] = useState(null);

  useEffect(() => { loadIdeas(); }, []);
  const loadIdeas = () => api.get('/ideas').then(res => setIdeas(res.data));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold font-serif">Idea Deck</h2>
         <button
           onClick={() => {
             setEditingIdea(null);
             setShowAdd(!showAdd);
           }}
           className="bg-stone-800 text-white px-4 py-2 rounded flex items-center gap-2"
         >
            <Plus size={18} /> Add Idea
          </button>
      </div>
      
      {showAdd && (
        <IdeaForm
          onCancel={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); loadIdeas(); }}
        />
      )}

      {editingIdea && (
        <IdeaForm
          initialIdea={editingIdea}
          onCancel={() => setEditingIdea(null)}
          onSuccess={() => { setEditingIdea(null); loadIdeas(); }}
        />
      )}

      <div className="grid gap-4">
        {ideas.map(idea => {
          const isExpanded = expandedIdeaId === idea.id;
          const planAPrepItems = Array.isArray(idea.planAPrepItems) ? idea.planAPrepItems : [];
          const planBPrepItems = Array.isArray(idea.planBPrepItems) ? idea.planBPrepItems : [];

          return (
            <div key={idea.id} className="bg-white rounded-lg border border-stone-200 shadow-sm">
              <div className="p-4 flex justify-between items-start gap-3">
                <button
                  onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                  className="text-left flex-1"
                >
                  <h3 className="font-bold">{idea.title}</h3>
                  <p className="text-stone-600 text-sm">{idea.shortDescription}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${idea.energy === 'high' ? 'bg-orange-100' : 'bg-blue-100'}`}>{idea.energy}</span>
                    <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">{idea.duration}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                    className="text-stone-400 hover:text-stone-700"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      setShowAdd(false);
                      setEditingIdea(idea);
                    }}
                    className="text-stone-400 hover:text-stone-700"
                    aria-label="Edit idea"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setMediaIdea(idea)}
                    className="text-stone-400 hover:text-stone-700"
                    aria-label="Media manager"
                  >
                    <ImagePlus size={16} />
                  </button>
                  <button
                    onClick={() => { if(confirm('Delete?')) api.delete(`/ideas/${idea.id}`).then(loadIdeas); }}
                    className="text-stone-400 hover:text-red-500"
                    aria-label="Delete idea"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-stone-200 p-4 bg-stone-50 space-y-4">
                  {idea.image && (
                    <div className="h-48 rounded-lg overflow-hidden bg-stone-200">
                      <img src={`/uploads/${idea.image}`} alt={idea.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border border-stone-200 rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Plan A Preparation</h4>
                      {planAPrepItems.length === 0 ? (
                        <div className="text-xs text-stone-500">No items yet.</div>
                      ) : (
                        <ul className="space-y-1 text-sm text-stone-700">
                          {planAPrepItems.map((item, idx) => <li key={`${idea.id}-a-${idx}`}>• {item}</li>)}
                        </ul>
                      )}
                    </div>
                    <div className="bg-white border border-stone-200 rounded-lg p-3">
                      <h4 className="font-semibold mb-2">Plan B Preparation</h4>
                      {planBPrepItems.length === 0 ? (
                        <div className="text-xs text-stone-500">No items yet.</div>
                      ) : (
                        <ul className="space-y-1 text-sm text-stone-700">
                          {planBPrepItems.map((item, idx) => <li key={`${idea.id}-b-${idx}`}>• {item}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {mediaIdea && (
        <MediaManagerModal
          idea={mediaIdea}
          onClose={() => setMediaIdea(null)}
          onSelect={loadIdeas}
        />
      )}
    </div>
  );
}

function IdeaForm({ initialIdea, onCancel, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', shortDescription: '', vibes: [], purposeTags: [], energy: 'med', seasonTags: [],
    radius: 'Vilnius', duration: '', budget: '', prepChecklist: [], planAPrepItems: [], planBPrepItems: [],
    planB: { title: '', description: '', steps: [], location: 'Home', duration: '', vibes: [], energy: 'low' }
  });
  const [draftFields, setDraftFields] = useState({
    vibesText: '',
    purposeTagsText: '',
    seasonTagsText: '',
    prepChecklistText: '',
    planAPrepItemsText: '',
    planBPrepItemsText: '',
    planBStepsText: '',
    planBVibesText: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingPlanAPrep, setGeneratingPlanAPrep] = useState(false);
  const [generatingPlanBPrep, setGeneratingPlanBPrep] = useState(false);
  const [aiSteeringText, setAiSteeringText] = useState('');
  const [aiThemes, setAiThemes] = useState([]);
  const [aiCustomTheme, setAiCustomTheme] = useState('');
  const isEditing = Boolean(initialIdea);

  const toCommaList = (items) => (items || []).join(', ');
  const toLineList = (items) => (items || []).join('\n');
  const parseCommaList = (value) => value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const parseLineList = (value) => value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);

  const getDraftFields = (sourceForm) => ({
    vibesText: toCommaList(sourceForm.vibes),
    purposeTagsText: toCommaList(sourceForm.purposeTags),
    seasonTagsText: toCommaList(sourceForm.seasonTags),
    prepChecklistText: toLineList(sourceForm.prepChecklist),
    planAPrepItemsText: toLineList(sourceForm.planAPrepItems || []),
    planBPrepItemsText: toLineList(sourceForm.planBPrepItems || []),
    planBStepsText: toLineList(sourceForm.planB?.steps || []),
    planBVibesText: toCommaList(sourceForm.planB?.vibes || [])
  });

  const applyDraftFields = (sourceForm, sourceDrafts) => ({
    ...sourceForm,
    vibes: parseCommaList(sourceDrafts.vibesText),
    purposeTags: parseCommaList(sourceDrafts.purposeTagsText),
    seasonTags: parseCommaList(sourceDrafts.seasonTagsText),
    prepChecklist: parseLineList(sourceDrafts.prepChecklistText),
    planAPrepItems: parseLineList(sourceDrafts.planAPrepItemsText),
    planBPrepItems: parseLineList(sourceDrafts.planBPrepItemsText),
    planB: {
      ...sourceForm.planB,
      steps: parseLineList(sourceDrafts.planBStepsText),
      vibes: parseCommaList(sourceDrafts.planBVibesText)
    }
  });

  useEffect(() => {
    setDraftFields(getDraftFields(form));
  }, []);

  useEffect(() => {
    if (!initialIdea) return;
    const planB = initialIdea.planB || {};
    const nextForm = {
      title: initialIdea.title || '',
      shortDescription: initialIdea.shortDescription || '',
      vibes: initialIdea.vibes || [],
      purposeTags: initialIdea.purposeTags || [],
      energy: initialIdea.energy || 'med',
      seasonTags: initialIdea.seasonTags || [],
      radius: initialIdea.radius || 'Vilnius',
      duration: initialIdea.duration || '',
      budget: initialIdea.budget || '',
      prepChecklist: initialIdea.prepChecklist || [],
      planAPrepItems: initialIdea.planAPrepItems || [],
      planBPrepItems: initialIdea.planBPrepItems || [],
      planB: {
        title: planB.title || '',
        description: planB.description || planB.shortDescription || '',
        steps: planB.steps || [],
        location: planB.location || 'Home',
        duration: planB.duration || '',
        vibes: planB.vibes || [],
        energy: planB.energy || 'low'
      }
    };
    setForm(nextForm);
    setDraftFields(getDraftFields(nextForm));
  }, [initialIdea]);

  const generate = async () => {
    setGenerating(true);
    try {
      const normalized = applyDraftFields(form, draftFields);
      const res = await api.post('/ai/draft', {
        steeringText: aiSteeringText,
        themes: aiThemes,
        customTheme: aiCustomTheme
      });
      const planB = res.data.planB || {};
      const merged = {
        ...normalized,
        ...res.data,
        planAPrepItems: Array.isArray(res.data.planAPrepItems) ? res.data.planAPrepItems : normalized.planAPrepItems,
        planBPrepItems: Array.isArray(res.data.planBPrepItems) ? res.data.planBPrepItems : normalized.planBPrepItems,
        planB: {
          ...normalized.planB,
          ...planB,
          description: planB.description || planB.shortDescription || normalized.planB.description
        }
      };
      setForm(merged);
      setDraftFields(getDraftFields(merged));
    } catch(e) {
      alert(e.response?.data?.message || e.response?.data?.error || 'AI Error or Quota Exceeded. Try manual.');
    }
    setGenerating(false);
  };

  const toggleTheme = (themeId) => {
    setAiThemes(prev => (
      prev.includes(themeId)
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
    ));
  };

  const generatePrep = async (planType) => {
    if (!isEditing || !initialIdea?.id) return;

    if (planType === 'A') {
      setGeneratingPlanAPrep(true);
    } else {
      setGeneratingPlanBPrep(true);
    }

    try {
      const endpoint = planType === 'A'
        ? `/ideas/${initialIdea.id}/prep/generate/plan-a`
        : `/ideas/${initialIdea.id}/prep/generate/plan-b`;
      const res = await api.post(endpoint);
      const nextForm = {
        ...form,
        ...(planType === 'A'
          ? { planAPrepItems: res.data.planAPrepItems || [] }
          : { planBPrepItems: res.data.planBPrepItems || [] })
      };
      setForm(nextForm);
      setDraftFields(getDraftFields(nextForm));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to generate preparation items');
    } finally {
      if (planType === 'A') {
        setGeneratingPlanAPrep(false);
      } else {
        setGeneratingPlanBPrep(false);
      }
    }
  };

  const save = async () => {
    try {
      const normalized = applyDraftFields(form, draftFields);
      setForm(normalized);
      const formData = new FormData();
      // Append top level fields
      Object.keys(normalized).forEach(key => {
        if (key === 'planB' || Array.isArray(normalized[key])) {
             formData.append(key, JSON.stringify(normalized[key]));
        } else {
             formData.append(key, normalized[key]);
        }
      });
      if (imageFile) formData.append('image', imageFile);

      if (isEditing) {
        await api.put(`/ideas/${initialIdea.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/ideas', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onSuccess();
    } catch(e) { alert('Error saving'); }
  };

  return (
     <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border-2 border-stone-100">
        <div className="flex justify-between mb-6">
           <h3 className="font-bold text-lg">{isEditing ? 'Edit Idea' : `New Idea - Step ${step}/2`}</h3>
           {step === 1 && !isEditing && (
             <button onClick={generate} disabled={generating} className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded border border-purple-100">
               {generating ? 'Generating...' : 'Auto-Fill (Plan A)'}
             </button>
           )}
        </div>

        {step === 1 && !isEditing && (
          <div className="mb-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="text-xs font-bold uppercase text-stone-500 mb-2">AI Steering (Optional)</div>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Theme Select (multi)</label>
                <div className="flex flex-wrap gap-2">
                  {AI_THEMES.map(theme => (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => toggleTheme(theme.id)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        aiThemes.includes(theme.id)
                          ? 'bg-stone-800 text-white border-stone-800'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Steering Note</label>
                <textarea
                  className="w-full border p-2 rounded"
                  rows={2}
                  placeholder="e.g. keep it indoors, no stargazing, something playful"
                  value={aiSteeringText}
                  onChange={e => setAiSteeringText(e.target.value)}
                />
                <div className="text-xs text-stone-400 mt-1">Used only for auto-fill prompts.</div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Custom Theme</label>
                <input
                  className="w-full border p-2 rounded"
                  placeholder="e.g. nostalgic winter cafe with board games"
                  value={aiCustomTheme}
                  onChange={e => setAiCustomTheme(e.target.value)}
                />
                <div className="text-xs text-stone-400 mt-1">Included in prompt only if filled.</div>
              </div>
            </div>
          </div>
        )}

        {(step === 1 || isEditing) && (
           <div className="space-y-4">
              <input className="w-full border p-2 rounded font-bold text-lg" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea className="w-full border p-2 rounded" rows={3} placeholder="Description" value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Duration</label>
                  <input className="w-full border p-2 rounded" placeholder="e.g. 2h" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Location / Area</label>
                  <input className="w-full border p-2 rounded" placeholder="e.g. Old Town" value={form.radius} onChange={e => setForm({...form, radius: e.target.value})} />
               </div>
                <div>
                   <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Energy</label>
                   <select className="w-full border p-2 rounded" value={form.energy} onChange={e => setForm({...form, energy: e.target.value})}>
                      <option value="low">Low Energy</option>
                      <option value="med">Med Energy</option>
                      <option value="high">High Energy</option>
                   </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Budget</label>
                  <input className="w-full border p-2 rounded" placeholder="e.g. low / med / 20 EUR" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Cover Image</label>
                   <input type="file" className="w-full text-sm" onChange={e => setImageFile(e.target.files[0])} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Vibes (comma separated)</label>
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="cozy, playful"
                    value={draftFields.vibesText}
                    onChange={e => setDraftFields({ ...draftFields, vibesText: e.target.value })}
                    onBlur={e => setForm({ ...form, vibes: parseCommaList(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Purpose Tags (comma separated)</label>
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="talk, laugh"
                    value={draftFields.purposeTagsText}
                    onChange={e => setDraftFields({ ...draftFields, purposeTagsText: e.target.value })}
                    onBlur={e => setForm({ ...form, purposeTags: parseCommaList(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Season Tags (comma separated)</label>
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="any, winter"
                    value={draftFields.seasonTagsText}
                    onChange={e => setDraftFields({ ...draftFields, seasonTagsText: e.target.value })}
                    onBlur={e => setForm({ ...form, seasonTags: parseCommaList(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Plan A Steps (Eiga)</label>
                <textarea
                  className="w-full border p-2 rounded"
                  rows={4}
                  placeholder="One step per line"
                  value={draftFields.prepChecklistText}
                  onChange={e => setDraftFields({ ...draftFields, prepChecklistText: e.target.value })}
                  onBlur={e => setForm({ ...form, prepChecklist: parseLineList(e.target.value) })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-stone-400">Plan A Preparation Items</label>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => generatePrep('A')}
                      disabled={generatingPlanAPrep}
                      className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded"
                    >
                      {generatingPlanAPrep ? 'Generating...' : 'Generate Plan A Prep'}
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full border p-2 rounded"
                  rows={4}
                  placeholder="One preparation item per line"
                  value={draftFields.planAPrepItemsText}
                  onChange={e => setDraftFields({ ...draftFields, planAPrepItemsText: e.target.value })}
                  onBlur={e => setForm({ ...form, planAPrepItems: parseLineList(e.target.value) })}
                />
              </div>
              
           </div>
        )}

        {!isEditing && step === 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onCancel} className="px-4 py-2 text-stone-500">Cancel</button>
            <button onClick={() => setStep(2)} className="px-4 py-2 bg-stone-800 text-white rounded flex items-center gap-2">
              Next: Plan B <ArrowRight size={16} />
            </button>
          </div>
        )}

        {(step === 2 || isEditing) && (
          <div className="space-y-4">
             <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-4">Plan B (Backup)</h4>
                <div className="space-y-3">
                   <input className="w-full border p-2 rounded" placeholder="Backup Title" value={form.planB.title || ''} onChange={e => setForm({...form, planB: {...form.planB, title: e.target.value}})} />
                   <textarea className="w-full border p-2 rounded" rows={2} placeholder="Backup Description" value={form.planB.description || ''} onChange={e => setForm({...form, planB: {...form.planB, description: e.target.value}})} />
                   <textarea
                     className="w-full border p-2 rounded"
                     rows={3}
                     placeholder="Plan B Steps (one per line)"
                     value={draftFields.planBStepsText}
                     onChange={e => setDraftFields({ ...draftFields, planBStepsText: e.target.value })}
                     onBlur={e => setForm({ ...form, planB: { ...form.planB, steps: parseLineList(e.target.value) } })}
                   />
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <label className="block text-xs font-bold uppercase text-stone-400">Plan B Preparation Items</label>
                       {isEditing && (
                         <button
                           type="button"
                           onClick={() => generatePrep('B')}
                           disabled={generatingPlanBPrep}
                           className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-900 px-2 py-1 rounded"
                         >
                           {generatingPlanBPrep ? 'Generating...' : 'Generate Plan B Prep'}
                         </button>
                       )}
                     </div>
                     <textarea
                       className="w-full border p-2 rounded"
                       rows={3}
                       placeholder="One preparation item per line"
                       value={draftFields.planBPrepItemsText}
                       onChange={e => setDraftFields({ ...draftFields, planBPrepItemsText: e.target.value })}
                       onBlur={e => setForm({ ...form, planBPrepItems: parseLineList(e.target.value) })}
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <input className="border p-2 rounded" placeholder="Location (e.g. Home)" value={form.planB.location || ''} onChange={e => setForm({...form, planB: {...form.planB, location: e.target.value}})} />
                     <input className="border p-2 rounded" placeholder="Duration" value={form.planB.duration || ''} onChange={e => setForm({...form, planB: {...form.planB, duration: e.target.value}})} />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Plan B Vibes</label>
                       <input
                         className="w-full border p-2 rounded"
                         placeholder="cozy, calm"
                         value={draftFields.planBVibesText}
                         onChange={e => setDraftFields({ ...draftFields, planBVibesText: e.target.value })}
                         onBlur={e => setForm({ ...form, planB: { ...form.planB, vibes: parseCommaList(e.target.value) } })}
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Plan B Energy</label>
                       <select
                         className="w-full border p-2 rounded"
                         value={form.planB.energy || 'low'}
                         onChange={e => setForm({ ...form, planB: { ...form.planB, energy: e.target.value } })}
                       >
                         <option value="low">Low Energy</option>
                         <option value="med">Med Energy</option>
                         <option value="high">High Energy</option>
                       </select>
                     </div>
                   </div>
                </div>
             </div>

             <div className="flex justify-between mt-4">
               {!isEditing && (
                 <button onClick={() => setStep(1)} className="px-4 py-2 text-stone-500 flex items-center gap-2">
                   <ArrowLeft size={16} /> Back
                 </button>
               )}
               <div className="flex gap-2 ml-auto">
                 <button onClick={onCancel} className="px-4 py-2 text-stone-500">Cancel</button>
                 <button onClick={save} className="px-6 py-2 bg-emerald-600 text-white rounded font-bold shadow-lg shadow-emerald-200">
                   {isEditing ? 'Save Changes' : 'Save Idea'}
                 </button>
               </div>
              </div>
           </div>
        )}
     </div>
  );
}

function AiSettingsModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    hasApiKey: false,
    apiKeyPreview: '',
    apiKey: '',
    textModel: '',
    imageModel: ''
  });
  const [clearApiKey, setClearApiKey] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/settings/ai');
      setSettings({
        ...res.data,
        apiKey: '',
        textModel: res.data.textModel || '',
        imageModel: res.data.imageModel || ''
      });
    } catch (e) {
      setError('Failed to load AI settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        textModel: settings.textModel,
        imageModel: settings.imageModel,
        clearApiKey
      };
      if (settings.apiKey.trim()) {
        payload.apiKey = settings.apiKey.trim();
      }
      const res = await api.put('/settings/ai', payload);
      setSettings({
        ...res.data,
        apiKey: '',
        textModel: res.data.textModel || '',
        imageModel: res.data.imageModel || ''
      });
      setClearApiKey(false);
      setSuccess('AI settings saved.');
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/settings/ai/test');
      setSuccess('Connection successful.');
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'AI connection test failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">AI Settings</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-stone-500 text-sm">Loading settings...</div>
        ) : (
          <div className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}
            {success && <div className="bg-emerald-50 text-emerald-700 text-sm p-2 rounded">{success}</div>}

            <div className="rounded-lg border border-stone-200 p-3 bg-stone-50 text-sm">
              <div className="font-medium">API key status</div>
              <div className="text-stone-500 mt-1">
                {settings.hasApiKey ? `Configured (${settings.apiKeyPreview})` : 'Not configured'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">New API Key</label>
              <input
                type="password"
                className="w-full border p-2 rounded"
                value={settings.apiKey}
                onChange={(e) => {
                  setSettings({ ...settings, apiKey: e.target.value });
                  if (e.target.value) setClearApiKey(false);
                }}
                placeholder="Paste new key to replace existing"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={clearApiKey}
                onChange={(e) => {
                  setClearApiKey(e.target.checked);
                  if (e.target.checked) {
                    setSettings({ ...settings, apiKey: '' });
                  }
                }}
              />
              Clear stored API key
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Text Model</label>
                <input
                  className="w-full border p-2 rounded"
                  value={settings.textModel}
                  onChange={e => setSettings({ ...settings, textModel: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Image Model</label>
                <input
                  className="w-full border p-2 rounded"
                  value={settings.imageModel}
                  onChange={e => setSettings({ ...settings, imageModel: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-2 text-stone-500">Close</button>
          <button
            onClick={testConnection}
            disabled={loading || testing}
            className="px-4 py-2 border rounded"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={saveSettings}
            disabled={loading || saving}
            className="px-4 py-2 bg-stone-800 text-white rounded"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaManagerModal({ idea, onClose, onSelect }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [currentImage, setCurrentImage] = useState('');
  const [autoPrompt, setAutoPrompt] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imageModel, setImageModel] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectingMediaId, setSelectingMediaId] = useState('');

  const loadMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const [mediaRes, promptRes, settingsRes] = await Promise.all([
        api.get(`/ideas/${idea.id}/media`),
        api.get(`/ideas/${idea.id}/media/auto-prompt`),
        api.get('/settings/ai')
      ]);
      setItems(mediaRes.data.items || []);
      setCurrentImage(mediaRes.data.currentImage || '');
      const fetchedAutoPrompt = promptRes.data.prompt || '';
      setAutoPrompt(fetchedAutoPrompt);
      setPrompt(prev => prev || fetchedAutoPrompt);
      setImageModel(settingsRes.data.imageModel || '');
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to load media manager.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [idea.id]);

  const generateImage = async () => {
    setGenerating(true);
    setError('');
    try {
      await api.post(`/ideas/${idea.id}/media/generate`, {
        prompt,
        promptAuto: autoPrompt,
        model: imageModel
      });
      await loadMedia();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Image generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const selectAsCover = async (mediaId) => {
    setSelectingMediaId(mediaId);
    setError('');
    try {
      const res = await api.post(`/ideas/${idea.id}/media/select`, { mediaId });
      setCurrentImage(res.data.image || '');
      if (onSelect) onSelect();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to select image.');
    } finally {
      setSelectingMediaId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 z-50 p-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-stone-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Media Manager</h3>
            <div className="text-sm text-stone-500">{idea.title}</div>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-stone-200 bg-stone-50">
          {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}
          <div className="grid gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPrompt(autoPrompt)}
                className="px-3 py-2 border rounded text-sm"
              >
                Autofill Smart Prompt
              </button>
              <button
                type="button"
                onClick={generateImage}
                disabled={loading || generating}
                className="px-3 py-2 bg-stone-800 text-white rounded text-sm"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
            <textarea
              className="w-full border p-2 rounded text-sm"
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Edit prompt and generate image"
            />
            <input
              className="w-full md:w-96 border p-2 rounded text-sm"
              value={imageModel}
              onChange={e => setImageModel(e.target.value)}
              placeholder="Image model"
            />
          </div>
        </div>

        <div className="p-4 overflow-auto">
          {loading ? (
            <div className="text-center text-stone-500 py-10">Loading media...</div>
          ) : items.length === 0 ? (
            <div className="text-center text-stone-500 py-10">No images yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden bg-white">
                  <div className="h-48 bg-stone-200">
                    <img src={`/uploads/${item.filename}`} alt="Generated date" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-stone-500">
                        {item.source === 'AI' ? 'Generated' : 'Uploaded'} {item.model ? `• ${item.model}` : ''}
                      </div>
                      {item.filename === currentImage && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Current cover</span>
                      )}
                    </div>
                    {item.promptUsed && (
                      <div className="text-xs bg-stone-50 border border-stone-200 rounded p-2 whitespace-pre-wrap">
                        Prompt used: {item.promptUsed}
                      </div>
                    )}
                    <button
                      onClick={() => selectAsCover(item.id)}
                      disabled={selectingMediaId === item.id}
                      className="w-full px-3 py-2 border rounded text-sm hover:bg-stone-50"
                    >
                      {selectingMediaId === item.id ? 'Selecting...' : 'Set as cover'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/update-password', { newPassword });
      setSuccess('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError('Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Change Password</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 text-sm p-2 rounded mb-3">{success}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-500">New Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500">Confirm Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-2 text-stone-500">Close</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 bg-stone-800 text-white rounded"
          >
            {submitting ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BingoTab() {
  const [tiles, setTiles] = useState([]);
  
  useEffect(() => {
    api.get('/bingo').then(res => setTiles(res.data));
  }, []);

  const TILES_CONFIG = [
      { id: 't1', label: 'Touched Base' },
      { id: 't2', label: 'Daylight/Outdoors' },
      { id: 't3', label: 'No-Scroll Hour' },
      { id: 't4', label: 'Laughed' },
      { id: 't5', label: 'Not Roommates' },
      { id: 't6', label: 'Something New' },
      { id: 't7', label: 'Warm & Safe' },
      { id: 't8', label: 'You Planned It' },
      { id: 't9', label: 'Plan B Saved Day' }
  ];

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold font-serif mb-6 text-center">Bingo Board</h2>
      <div className="grid grid-cols-3 gap-3">
        {TILES_CONFIG.map(conf => {
           const earned = tiles.find(t => t.id === conf.id);
           return (
             <div key={conf.id} className={`aspect-square flex flex-col items-center justify-center p-2 text-center rounded-lg border-2 transition-all ${earned ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg scale-105' : 'bg-stone-100 text-stone-400 border-dashed border-stone-200'}`}>
                {earned && <CheckCircle size={24} className="mb-2" />}
                <span className="font-bold text-sm leading-tight">{conf.label}</span>
             </div>
           );
        })}
      </div>
      <div className="text-center mt-8">
        <button onClick={() => { if(confirm('Reset Bingo?')) api.post('/bingo/reset').then(() => setTiles([])); }} className="text-xs text-stone-400 underline hover:text-red-500">
           Reset Board
        </button>
      </div>
    </div>
  );
}

function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/planning/history')
      .then(res => setHistory(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-stone-400 mt-10">Kraunama istorija...</div>;
  }

  if (history.length === 0) {
    return <div className="text-center text-stone-400 mt-10">Kol kas istorijos nėra.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4">Istorija</h2>
      {history.map(plan => (
        <div key={plan.id} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg">{plan.idea?.title}</h3>
              <p className="text-sm text-stone-500">{plan.idea?.shortDescription}</p>
            </div>
            <div className="text-sm text-stone-400">
              {plan.completedAt ? new Date(plan.completedAt).toLocaleDateString() : '—'}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
            <span className="bg-stone-100 px-2 py-1 rounded">Įvertinimas: {plan.rating || '—'}</span>
            <span className="bg-stone-100 px-2 py-1 rounded">Energija: {plan.idea?.energy || '—'}</span>
            <span className="bg-stone-100 px-2 py-1 rounded">Trukmė: {plan.idea?.duration || '—'}</span>
            <span className="bg-stone-100 px-2 py-1 rounded">Vieta: {plan.idea?.radius || '—'}</span>
          </div>
          {plan.notes && (
            <div className="mt-3 text-sm text-stone-600">
              Pastabos: {plan.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

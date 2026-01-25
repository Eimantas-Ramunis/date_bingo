import { useState, useEffect } from 'react';
import api from '../api';
import {
  Calendar, Shuffle, CheckCircle, Plus, Sparkles, LogOut,
  LayoutGrid, History, Trash2, Edit, Save, X, Eye, ArrowRight, ArrowLeft,
  KeyRound
} from 'lucide-react';

const TABS = [
  { id: 'plan', label: 'Plan', icon: Calendar },
  { id: 'deck', label: 'Deck', icon: Shuffle },
  { id: 'bingo', label: 'Bingo', icon: LayoutGrid },
  { id: 'history', label: 'History', icon: History },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('plan');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-stone-900 text-stone-400 w-full md:w-64 flex-shrink-0 flex flex-col">
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
    </div>
  );
}

// --- TAB COMPONENTS ---

function PlanTab({ currentPlan, refresh }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectingIdea, setSelectingIdea] = useState(null);
  const [loading, setLoading] = useState(false);

  const suggest = async () => {
    setLoading(true);
    const res = await api.get('/planning/suggest');
    setSuggestions(res.data);
    setLoading(false);
  };

  const handleSelect = (idea) => {
    setSelectingIdea(idea);
  };

  if (selectingIdea) {
    return <PlanningForm idea={selectingIdea} onCancel={() => setSelectingIdea(null)} onSuccess={() => { setSelectingIdea(null); refresh(); }} />;
  }

  if (currentPlan) {
    return <ActivePlanView plan={currentPlan} refresh={refresh} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">Plan Next Date</h2>
      
      {suggestions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <div className="mb-4">No active plan. Time to schedule something?</div>
          <button 
            onClick={suggest} 
            disabled={loading}
            className="bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Suggest 3 Ideas'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-stone-500">Suggestions</h3>
             <button onClick={suggest} className="text-sm text-stone-400 hover:text-stone-800 flex items-center gap-1">
               <Shuffle size={14} /> Reshuffle
             </button>
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

      <div className="flex gap-4">
        <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-stone-50">Cancel</button>
        <button onClick={submit} disabled={loading} className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700">Confirm Plan</button>
      </div>
    </div>
  );
}

function ActivePlanView({ plan, refresh }) {
  const [links, setLinks] = useState({ hint: '', reveal: '' });
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const generateLink = async (type) => {
    const res = await api.post('/planning/token', { plannedDateId: plan.id, type });
    const url = `${window.location.origin}/r?token=${res.data.token}`;
    setLinks(prev => ({ ...prev, [type.toLowerCase()]: url }));
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const cancelPlan = async () => {
    if (!confirm('Cancel this plan? Links will stop working.')) return;
    setCancelling(true);
    try {
      await api.delete(`/planning/${plan.id}`);
      refresh();
    } catch (e) {
      alert('Failed to cancel plan');
    } finally {
      setCancelling(false);
    }
  };

  if (completing) return <CompleteForm plan={plan} onCancel={() => setCompleting(false)} onSuccess={refresh} />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${plan.status === 'VETOED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
               Status: {plan.status}
            </span>
            {plan.planBActive && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full uppercase font-bold">Plan B Active</span>}
          </div>
          <h2 className="text-3xl font-serif font-bold">{plan.idea.title}</h2>
          {plan.status === 'VETOED' && (
             <div className="mt-2 text-red-600 font-medium">
               Veto Reason: <span className="italic">"{plan.vetoReason}"</span>
             </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={cancelPlan} disabled={cancelling} className="bg-stone-200 text-stone-700 px-4 py-2 rounded hover:bg-stone-300">
            {cancelling ? 'Cancelling...' : 'Cancel Plan'}
          </button>
          <button onClick={() => setCompleting(true)} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2">
            <CheckCircle size={18} /> Mark Done
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-4">
               <h3 className="font-bold border-b pb-2">Links</h3>
               <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Hint Link</div>
                    <div className="text-xs text-stone-500">Send day before</div>
                  </div>
                  <button onClick={() => generateLink('HINT')} className="text-sm bg-stone-100 px-3 py-1 rounded hover:bg-stone-200">
                    Generate & Copy
                  </button>
               </div>
               <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Reveal Link</div>
                    <div className="text-xs text-stone-500">Send day of</div>
                  </div>
                  <button onClick={() => generateLink('REVEAL')} className="text-sm bg-stone-100 px-3 py-1 rounded hover:bg-stone-200">
                    Generate & Copy
                  </button>
               </div>
            </div>

            {plan.planBActive && (
               <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                  <h3 className="font-bold text-yellow-900 border-b border-yellow-200 pb-2 mb-3">Plan B Details</h3>
                  <h4 className="font-bold text-lg">{plan.planBTitle}</h4>
                  <p className="text-sm text-stone-700 mb-2">{plan.planBDesc}</p>
                  <ul className="list-disc pl-4 text-sm text-stone-600">
                     {plan.planBSteps.map((s,i) => <li key={i}>{s}</li>)}
                  </ul>
               </div>
            )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-fit">
           <h3 className="font-bold border-b pb-2 mb-4">Plan A Details</h3>
           <div className="space-y-2 text-sm">
             <div className="grid grid-cols-3"><span className="text-stone-500">Teaser</span> <span className="col-span-2 italic">{plan.hintTeaser}</span></div>
             <div className="grid grid-cols-3"><span className="text-stone-500">Time</span> <span className="col-span-2">{plan.hintStartTime}</span></div>
             <div className="grid grid-cols-3"><span className="text-stone-500">Dress</span> <span className="col-span-2">{plan.hintDressCode}</span></div>
             <div className="grid grid-cols-3"><span className="text-stone-500">Duration</span> <span className="col-span-2">{plan.hintDuration}</span></div>
           </div>
        </div>
      </div>
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
        {ideas.map(idea => (
          <div key={idea.id} className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm flex justify-between items-start">
             <div>
               <h3 className="font-bold">{idea.title}</h3>
               <p className="text-stone-600 text-sm">{idea.shortDescription}</p>
               <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${idea.energy === 'high' ? 'bg-orange-100' : 'bg-blue-100'}`}>{idea.energy}</span>
                  <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">{idea.duration}</span>
               </div>
             </div>
            <div className="flex items-center gap-2">
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
                onClick={() => { if(confirm('Delete?')) api.delete(`/ideas/${idea.id}`).then(loadIdeas); }}
                className="text-stone-400 hover:text-red-500"
                aria-label="Delete idea"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdeaForm({ initialIdea, onCancel, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', shortDescription: '', vibes: [], purposeTags: [], energy: 'med', seasonTags: [],
    radius: 'Vilnius', duration: '', budget: '', prepChecklist: [],
    planB: { title: '', description: '', steps: [], location: 'Home', duration: '' }
  });
  const [imageFile, setImageFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const isEditing = Boolean(initialIdea);

  useEffect(() => {
    if (!initialIdea) return;
    const planB = initialIdea.planB || {};
    setForm({
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
      planB: {
        title: planB.title || '',
        description: planB.description || planB.shortDescription || '',
        steps: planB.steps || [],
        location: planB.location || 'Home',
        duration: planB.duration || ''
      }
    });
  }, [initialIdea]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/ai/draft');
      const planB = res.data.planB || {};
      const merged = {
        ...form,
        ...res.data,
        planB: {
          ...form.planB,
          ...planB,
          description: planB.description || planB.shortDescription || form.planB.description
        }
      };
      setForm(merged);
    } catch(e) { alert('AI Error or Quota Exceeded. Try manual.'); }
    setGenerating(false);
  };

  const save = async () => {
    try {
      const formData = new FormData();
      // Append top level fields
      Object.keys(form).forEach(key => {
        if (key === 'planB' || Array.isArray(form[key])) {
             formData.append(key, JSON.stringify(form[key]));
        } else {
             formData.append(key, form[key]);
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
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Cover Image</label>
                  <input type="file" className="w-full text-sm" onChange={e => setImageFile(e.target.files[0])} />
               </div>
             </div>

             <div className="flex justify-end gap-2 mt-4">
               <button onClick={onCancel} className="px-4 py-2 text-stone-500">Cancel</button>
               {!isEditing && (
                 <button onClick={() => setStep(2)} className="px-4 py-2 bg-stone-800 text-white rounded flex items-center gap-2">
                   Next: Plan B <ArrowRight size={16} />
                 </button>
               )}
               {isEditing && (
                 <button onClick={save} className="px-6 py-2 bg-emerald-600 text-white rounded font-bold shadow-lg shadow-emerald-200">
                   Save Changes
                 </button>
               )}
             </div>
          </div>
        )}

        {step === 2 && !isEditing && (
          <div className="space-y-4">
             <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-4">Plan B (Backup)</h4>
                <div className="space-y-3">
                   <input className="w-full border p-2 rounded" placeholder="Backup Title" value={form.planB.title || ''} onChange={e => setForm({...form, planB: {...form.planB, title: e.target.value}})} />
                   <textarea className="w-full border p-2 rounded" rows={2} placeholder="Backup Description" value={form.planB.description || ''} onChange={e => setForm({...form, planB: {...form.planB, description: e.target.value}})} />
                   
                   <div className="grid grid-cols-2 gap-4">
                     <input className="border p-2 rounded" placeholder="Location (e.g. Home)" value={form.planB.location || ''} onChange={e => setForm({...form, planB: {...form.planB, location: e.target.value}})} />
                     <input className="border p-2 rounded" placeholder="Duration" value={form.planB.duration || ''} onChange={e => setForm({...form, planB: {...form.planB, duration: e.target.value}})} />
                   </div>
                </div>
             </div>

             <div className="flex justify-between mt-4">
               <button onClick={() => setStep(1)} className="px-4 py-2 text-stone-500 flex items-center gap-2">
                 <ArrowLeft size={16} /> Back
               </button>
               <div className="flex gap-2">
                 <button onClick={onCancel} className="px-4 py-2 text-stone-500">Cancel</button>
                  <button onClick={save} className="px-6 py-2 bg-emerald-600 text-white rounded font-bold shadow-lg shadow-emerald-200">
                    Save Idea
                  </button>
                </div>
              </div>
           </div>
        )}
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
  return <div className="text-center text-stone-400 mt-10">History feature coming soon (Events are logged in DB).</div>;
}

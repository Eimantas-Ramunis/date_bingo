import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Clock, Sun, MapPin, Gift, Moon } from 'lucide-react';
import api from '../api';
import { useTheme } from '../theme';

export default function ReceiverView() {
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vetoing, setVetoing] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(null);
  const [showOtherReason, setShowOtherReason] = useState(false);
  const [otherReason, setOtherReason] = useState('');

  const fetchData = async () => {
    if (!token) {
      setError('Trūksta nuorodos ženklo. Paprašykite naujos nuorodos.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/receiver', { params: { token } });
      setData(res.data);
      setError('');
      setEnergyLevel(null);
    } catch (err) {
      const code = err.response?.data?.error;
      const message = code === 'Invalid token'
        ? 'Netinkama nuoroda. Paprašykite naujos.'
        : code?.includes('expired')
          ? 'Ši nuoroda nebegalioja. Paprašykite naujos.'
          : 'Nepavyko įkelti informacijos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleVeto = async (reason) => {
    if (!confirm('Aktyvuoti Planą B? Atšaukti negalėsi.')) return;
    try {
      setVetoing(true);
      await api.post('/receiver/veto', { token, reason });
      await fetchData();
    } catch (err) {
      alert('Nepavyko atšaukti');
    } finally {
      setVetoing(false);
    }
  };

  const renderWithTheme = (content) => (
    <>
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 bg-black/20 text-white backdrop-blur px-3 py-2 rounded-full text-xs font-medium hover:bg-black/30"
      >
        {theme === 'dark' ? <Sun size={14} className="inline mr-1" /> : <Moon size={14} className="inline mr-1" />}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      {content}
    </>
  );

  if (loading) {
    return renderWithTheme(<div className="min-h-screen flex items-center justify-center bg-stone-50">Kraunama...</div>);
  }

  if (error) {
    return renderWithTheme(<div className="min-h-screen flex items-center justify-center bg-stone-50 text-red-600">{error}</div>);
  }

  if (!data) return null;

  const { type, hint, reveal, status, planBActive, bingoTiles } = data;
  const isVetoed = status === 'VETOED' || planBActive;
  const planBSteps = reveal?.planB?.steps || [];
  const planASteps = reveal?.planA?.steps || [];
  const showPlanB = isVetoed || energyLevel === 'low';

  const handleEnergySelect = async (level) => {
    setEnergyLevel(level);
    if (level === 'low') {
      await handleVeto('low energy');
    }
  };

  const submitOtherReason = async (forceEmpty = false) => {
    const reason = forceEmpty ? '' : otherReason;
    setShowOtherReason(false);
    setOtherReason('');
    await handleVeto(reason);
  };

  if (type === 'HINT') {
    return renderWithTheme(
      <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
          <div className="bg-stone-800 p-6 text-white text-center">
            <h1 className="font-serif text-2xl font-bold">Rytojaus Pasimatymas</h1>
            <p className="text-stone-300 text-sm mt-1">Maža užuomina...</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center">
              <Gift className="mx-auto text-rose-400 mb-4" size={48} />
              <p className="text-xl font-medium text-stone-800 italic">"{hint?.teaser || '...' }"</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-stone-500 mb-1 font-bold uppercase text-xs">
                  <Clock size={12} /> Pradžia
                </div>
                <div className="font-semibold">{hint?.startTime || '-'}</div>
              </div>
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-stone-500 mb-1 font-bold uppercase text-xs">
                  <Sun size={12} /> Apranga
                </div>
                <div className="font-semibold">{hint?.dressCode || '-'}</div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-stone-100">
              <span className="inline-block px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-500">
                {hint?.duration || '...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'BINGO') {
    const tiles = bingoTiles || [];
    const earnedIds = new Set(tiles.map(tile => tile.id));
    const BINGO_TILES = [
      { id: 't1', label: 'Prisiglaudėme' },
      { id: 't2', label: 'Diena lauke' },
      { id: 't3', label: 'Be telefono valandos' },
      { id: 't4', label: 'Juokėmės' },
      { id: 't5', label: 'Nebuvome kambariokai' },
      { id: 't6', label: 'Kažkas naujo' },
      { id: 't7', label: 'Šilta ir saugu' },
      { id: 't8', label: 'Tu suplanavai' },
      { id: 't9', label: 'Plan B išgelbėjo' }
    ];

    return renderWithTheme(
      <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl font-bold text-stone-800">Bingo korta</h1>
            <p className="text-sm text-stone-500 mt-1">Bendri prisiminimai</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {BINGO_TILES.map(tile => {
              const earned = earnedIds.has(tile.id);
              return (
                <div
                  key={tile.id}
                  className={`aspect-square flex flex-col items-center justify-center p-2 text-center rounded-lg border-2 transition-all ${earned ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg scale-105' : 'bg-white text-stone-400 border-dashed border-stone-200'}`}
                >
                  <span className="font-bold text-sm leading-tight">{tile.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'REVEAL' || isVetoed) {
    if (showPlanB) {
      return renderWithTheme(
        <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-emerald-100 p-6">
            <div className="flex justify-center mb-4">
              <Shield className="text-emerald-500" size={40} />
            </div>
            <h1 className="text-center font-serif text-2xl font-bold text-stone-800 mb-2">Planas B</h1>
            <p className="text-center text-stone-500 text-sm mb-6">Jokio spaudimo. Ramus vakaras.</p>

            <div className="bg-emerald-50/50 p-4 rounded-lg mb-6">
              <h2 className="font-bold text-lg text-emerald-900 mb-2">{reveal?.planB?.title || 'Planas B'}</h2>
              <p className="text-stone-700 text-sm mb-4">{reveal?.planB?.description || 'Poilsio planas namuose.'}</p>
              <ul className="space-y-2">
                {planBSteps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-stone-600">
                    <span className="text-emerald-400">•</span> {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center text-xs text-stone-400">
              Originalus planas ({reveal?.planA_summary || reveal?.planA?.title || 'Planas A'}) atidėtas kitam kartui.
            </div>
          </div>
        </div>
      );
    }

    return renderWithTheme(
      <div className="min-h-screen bg-rose-50/30 p-6 pb-24">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          {reveal?.planA?.image ? (
            <div className="h-48 w-full bg-stone-200">
              <img src={`/uploads/${reveal.planA.image}`} alt="Pasimatymas" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-2 bg-stone-800" />
          )}

          <div className="p-6">
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">{reveal?.planA?.title || 'Planas A'}</h1>
            <p className="text-stone-600 leading-relaxed mb-6">{reveal?.planA?.description || ''}</p>

            <div className="flex gap-4 mb-6 text-sm text-stone-500">
              <div className="flex items-center gap-1">
                <Clock size={16} /> {reveal?.planA?.duration || '-'}
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} /> {reveal?.planA?.radius || '-'}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-stone-800 uppercase text-xs tracking-wider">Eiga</h3>
              <ul className="space-y-3">
                {planASteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-stone-700 bg-stone-50 p-3 rounded-lg text-sm">
                    <span className="font-bold text-stone-300">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto mt-8 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
            <p className="text-sm text-stone-500 mb-3">Kaip tavo energija?</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleEnergySelect('low')}
                className={`p-2 rounded text-xs border ${energyLevel === 'low' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-50 text-stone-600'}`}
              >
                Žema
              </button>
              <button
                onClick={() => handleEnergySelect('medium')}
                className={`p-2 rounded text-xs border ${energyLevel === 'medium' ? 'bg-stone-800 text-white border-stone-800' : 'bg-stone-50 text-stone-600'}`}
              >
                Vidutinė
              </button>
              <button
                onClick={() => handleEnergySelect('high')}
                className={`p-2 rounded text-xs border ${energyLevel === 'high' ? 'bg-amber-500 text-white border-amber-500' : 'bg-stone-50 text-stone-600'}`}
              >
                Aukšta
              </button>
            </div>
            {energyLevel === 'low' && (
              <p className="text-xs text-stone-500 mt-3">Automatiškai persijungiame į Planą B.</p>
            )}
            {energyLevel === 'high' && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
                Papildomas prieskonis: įtraukite mažą staigmeną susijusią su "{reveal?.planA?.title || 'Planu'}".
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-stone-400">Šiandien nelabai?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleVeto('tired')} disabled={vetoing} className="p-2 border bg-white rounded text-xs hover:bg-red-50 text-stone-600">
                Pavargusi
              </button>
              <button onClick={() => handleVeto('weather')} disabled={vetoing} className="p-2 border bg-white rounded text-xs hover:bg-red-50 text-stone-600">
                Per šalta/šlapia
              </button>
              <button onClick={() => handleVeto('social')} disabled={vetoing} className="p-2 border bg-white rounded text-xs hover:bg-red-50 text-stone-600">
                Nenoriu žmonių
              </button>
              <button onClick={() => handleVeto('generic')} disabled={vetoing} className="p-2 border bg-white rounded text-xs hover:bg-red-50 text-stone-600">
                Šiandien ne
              </button>
            </div>
            <button
              onClick={() => setShowOtherReason(true)}
              disabled={vetoing}
              className="w-full p-2 border bg-white rounded text-xs hover:bg-stone-100 text-stone-600"
            >
              Kita priežastis
            </button>
            {showOtherReason && (
              <div className="mt-3 bg-white border rounded-lg p-3 text-left space-y-2">
                <label className="text-xs text-stone-500">Trumpai parašykite priežastį (nebūtina)</label>
                <textarea
                  rows={3}
                  className="w-full border rounded p-2 text-sm"
                  value={otherReason}
                  onChange={e => setOtherReason(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => submitOtherReason(true)}
                    className="text-xs text-stone-500"
                  >
                    Uždaryti
                  </button>
                  <button
                    onClick={() => submitOtherReason(false)}
                    className="text-xs bg-stone-800 text-white px-3 py-1 rounded"
                  >
                    Patvirtinti
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

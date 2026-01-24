// ... imports
import { Shield, Clock, Sun, MapPin, XCircle, Gift, Info } from 'lucide-react';

export default function ReceiverView() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // ... state logic (keep same)

  // ... fetch logic (keep same)

  const handleVeto = async (reason) => {
    if (!confirm("Aktyvuoti Planą B? Atšaukti negalėsi.")) return; // LT confirm
    try {
      setVetoing(true);
      await api.post('/receiver/veto', { token, reason });
      fetchData(); 
    } catch (err) {
      alert('Nepavyko atšaukti');
    } finally {
      setVetoing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50">Kraunama...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-red-600">{error}</div>;

  const { type, hint, reveal, status, planBActive } = data;
  const isVetoed = status === 'VETOED' || planBActive;

  // HINT VIEW
  if (type === 'HINT') {
    return (
      <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
           <div className="bg-stone-800 p-6 text-white text-center">
             <h1 className="font-serif text-2xl font-bold">Rytojaus Pasimatymas</h1>
             <p className="text-stone-300 text-sm mt-1">Maža užuomina...</p>
           </div>
           
           <div className="p-8 space-y-6">
              <div className="text-center">
                <Gift className="mx-auto text-rose-400 mb-4" size={48} />
                <p className="text-xl font-medium text-stone-800 italic">"{hint.teaser}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="bg-stone-50 p-3 rounded-lg">
                   <div className="flex items-center gap-2 text-stone-500 mb-1 font-bold uppercase text-xs">
                     <Clock size={12} /> Pradžia
                   </div>
                   <div className="font-semibold">{hint.startTime}</div>
                 </div>
                 <div className="bg-stone-50 p-3 rounded-lg">
                   <div className="flex items-center gap-2 text-stone-500 mb-1 font-bold uppercase text-xs">
                     <Sun size={12} /> Apranga
                   </div>
                   <div className="font-semibold">{hint.dressCode}</div>
                 </div>
              </div>

              <div className="text-center pt-4 border-t border-stone-100">
                 <span className="inline-block px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-500">
                    {hint.duration}
                 </span>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // REVEAL VIEW
  if (type === 'REVEAL' || isVetoed) {
    if (isVetoed) {
      // Plan B View
      return (
        <div className="min-h-screen bg-stone-50 p-6 flex flex-col items-center justify-center">
           <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-emerald-100 p-6">
              <div className="flex justify-center mb-4">
                 <Shield className="text-emerald-500" size={40} />
              </div>
              <h1 className="text-center font-serif text-2xl font-bold text-stone-800 mb-2">Planas B</h1>
              <p className="text-center text-stone-500 text-sm mb-6">Jokio spaudimo. Ramus vakaras.</p>
              
              <div className="bg-emerald-50/50 p-4 rounded-lg mb-6">
                 <h2 className="font-bold text-lg text-emerald-900 mb-2">{reveal.planB.title}</h2>
                 <p className="text-stone-700 text-sm mb-4">{reveal.planB.description}</p>
                 <ul className="space-y-2">
                    {reveal.planB.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm text-stone-600">
                        <span className="text-emerald-400">•</span> {step}
                      </li>
                    ))}
                 </ul>
              </div>
              
              <div className="text-center text-xs text-stone-400">
                Originalus planas ({reveal.planA_summary}) atidėtas kitam kartui.
              </div>
           </div>
        </div>
      );
    }

    // Plan A View
    return (
      <div className="min-h-screen bg-rose-50/30 p-6 pb-24">
         <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
            {reveal.planA.image ? (
                <div className="h-48 w-full bg-stone-200">
                    <img src={`/uploads/${reveal.planA.image}`} alt="Date" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="h-2 bg-stone-800" />
            )}
            
            <div className="p-6">
               <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">{reveal.planA.title}</h1>
               <p className="text-stone-600 leading-relaxed mb-6">{reveal.planA.description}</p>
               
               <div className="flex gap-4 mb-6 text-sm text-stone-500">
                  <div className="flex items-center gap-1">
                    <Clock size={16} /> {reveal.planA.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} /> {reveal.planA.radius}
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 uppercase text-xs tracking-wider">Eiga</h3>
                  <ul className="space-y-3">
                    {reveal.planA.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-stone-700 bg-stone-50 p-3 rounded-lg text-sm">
                        <span className="font-bold text-stone-300">{i+1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
         </div>

         {/* Veto Section */}
         <div className="max-w-md mx-auto mt-8 text-center space-y-4">
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
         </div>
      </div>
    );
  }

  return null;
}

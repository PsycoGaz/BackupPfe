import { useState, useEffect } from 'react';
import { formationService } from '../services/formation.service';

export function DomainsPage() {
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const data = await formationService.getDomains();
      setDomains(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      await formationService.createDomain(newDomain.trim());
      setNewDomain('');
      loadDomains();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleRename = async (oldName: string) => {
    if (!editValue.trim() || editValue.trim() === oldName) {
      setEditingDomain(null);
      return;
    }
    try {
      await formationService.renameDomain(oldName, editValue.trim());
      setEditingDomain(null);
      loadDomains();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Supprimer le domaine "${name}" ?`)) return;
    try {
      await formationService.deleteDomain(name);
      loadDomains();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Gestion des domaines</h1>
        <p className="text-sm text-slate-500 mt-1">
          Organisez les formations par domaine. Renommez ou supprimez les domaines existants.
        </p>
      </div>

      {/* Add domain */}
      <form onSubmit={handleCreate} className="card p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Nom du nouveau domaine..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary" disabled={!newDomain.trim()}>
            Ajouter
          </button>
        </div>
      </form>

      {/* Domain list */}
      <div className="card divide-y divide-slate-100">
        {domains.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">Aucun domaine défini.</p>
          </div>
        ) : (
          domains.map((domain) => (
            <div key={domain} className="px-5 py-3 flex items-center justify-between">
              {editingDomain === domain ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(domain);
                      if (e.key === 'Escape') setEditingDomain(null);
                    }}
                    className="input-field flex-1"
                    autoFocus
                  />
                  <button onClick={() => handleRename(domain)} className="btn-primary text-xs px-3 py-1.5">
                    Enregistrer
                  </button>
                  <button onClick={() => setEditingDomain(null)} className="btn-secondary text-xs px-3 py-1.5">
                    Annuler
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                    <span className="text-sm font-medium text-slate-700">{domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingDomain(domain); setEditValue(domain); }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      title="Renommer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(domain)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

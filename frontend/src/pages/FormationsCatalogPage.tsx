import { useState, useEffect } from 'react';
import { formationService } from '../services/formation.service';
import { Formation } from '../types';

export function FormationsCatalogPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    try {
      const data = await formationService.getAll();
      setFormations(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await formationService.create({
        name,
        domain,
        description: description || undefined,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      });
      setName('');
      setDomain('');
      setDescription('');
      setEstimatedCost('');
      setShowForm(false);
      loadFormations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return;
    try {
      await formationService.remove(id);
      loadFormations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestion du catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">Ajoutez, modifiez ou supprimez les formations disponibles.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showForm ? 'Fermer' : 'Ajouter une formation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-3">
          <input
            type="text"
            placeholder="Nom de la formation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="text"
            placeholder="Domaine"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
            className="input-field"
          />
          <textarea
            placeholder="Description (optionnelle)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Co\u00fbt estim\u00e9 (DA)"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            min="0"
            step="0.01"
            className="input-field"
          />
          <button type="submit" className="btn-primary">
            Cr\u00e9er la formation
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Nom
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Domaine
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Description
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Co\u00fbt
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {formations.map((formation) => (
              <tr key={formation.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{formation.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    {formation.domain}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                  {formation.description || '-'}
                </td>
                <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-700">
                  {formation.estimatedCost != null ? `${Number(formation.estimatedCost).toLocaleString('fr-FR')} DA` : '-'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => handleDelete(formation.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formationService } from '../services/formation.service';
import { Formation } from '../types';

export function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

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

  const domains = [...new Set(formations.map((f) => f.domain))];

  const filtered = formations.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase()) ||
      f.domain.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = !domainFilter || f.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Catalogue des formations</h1>
        <p className="text-sm text-slate-500 mt-1">Parcourez les formations disponibles et soumettez une demande.</p>
      </div>

      {/* Search & filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom, domaine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Tous les domaines</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-400 mt-2">{filtered.length} formation{filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* Formations grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">Aucune formation ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((formation) => (
            <div key={formation.id} className="card-hover">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-900">{formation.name}</h3>
                <span className="inline-block mt-1.5 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  {formation.domain}
                </span>
                {formation.description && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">{formation.description}</p>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Link
                    to={`/create-request?formationId=${formation.id}&formationName=${encodeURIComponent(formation.name)}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Demander cette formation
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

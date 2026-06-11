import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trainingRequestService } from '../services/training-request.service';
import { formationService } from '../services/formation.service';
import { Formation, RequestType } from '../types';

export function CreateRequestPage() {
  const [searchParams] = useSearchParams();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [requestType, setRequestType] = useState<RequestType>(
    searchParams.get('formationId') ? RequestType.CATALOGUE : RequestType.NOUVELLE
  );
  const [formationId, setFormationId] = useState(searchParams.get('formationId') || '');
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogDomain, setCatalogDomain] = useState('');
  const [customFormationName, setCustomFormationName] = useState('');
  const [domain, setDomain] = useState('');
  const [desiredStartDate, setDesiredStartDate] = useState('');
  const [desiredEndDate, setDesiredEndDate] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    formationService.getAll().then((data) => {
      setFormations(data);
      // If formationId from URL, auto-select
      const preselected = searchParams.get('formationId');
      if (preselected) {
        const found = data.find((f) => f.id === preselected);
        if (found) {
          setSelectedFormation(found);
          setFormationId(found.id);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const domains = [...new Set(formations.map((f) => f.domain))];

  const filteredFormations = formations.filter((f) => {
    const matchesSearch =
      !catalogSearch ||
      f.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      f.description?.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      f.domain.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesDomain = !catalogDomain || f.domain === catalogDomain;
    return matchesSearch && matchesDomain;
  });

  const handleSelectFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setFormationId(formation.id);
  };

  const handleClearSelection = () => {
    setSelectedFormation(null);
    setFormationId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await trainingRequestService.create({
        requestType,
        formationId: requestType === RequestType.CATALOGUE && formationId ? formationId : undefined,
        customFormationName:
          requestType === RequestType.NOUVELLE ? customFormationName : undefined,
        domain: domain || undefined,
        desiredStartDate,
        desiredEndDate: desiredEndDate || undefined,
        justification: justification || undefined,
      });
      navigate('/my-requests');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nouvelle demande de formation</h1>
        <p className="text-sm text-slate-500 mt-1">Choisissez une formation du catalogue ou proposez-en une nouvelle.</p>
      </div>

      {/* Type selector - tabs style */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => { setRequestType(RequestType.CATALOGUE); handleClearSelection(); }}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            requestType === RequestType.CATALOGUE
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Depuis le catalogue
        </button>
        <button
          type="button"
          onClick={() => setRequestType(RequestType.NOUVELLE)}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            requestType === RequestType.NOUVELLE
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Nouvelle formation
        </button>
      </div>

      {/* CATALOGUE MODE: Search & Select */}
      {requestType === RequestType.CATALOGUE && (
        <div className="space-y-4">
          {!selectedFormation ? (
            <>
              {/* Search bar */}
              <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Rechercher une formation..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <select
                    value={catalogDomain}
                    onChange={(e) => setCatalogDomain(e.target.value)}
                    className="input-field w-auto"
                  >
                    <option value="">Tous les domaines</option>
                    {domains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {filteredFormations.length} formation{filteredFormations.length > 1 ? 's' : ''} disponible{filteredFormations.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* Formation cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFormations.map((formation) => (
                  <button
                    key={formation.id}
                    type="button"
                    onClick={() => handleSelectFormation(formation)}
                    className="text-left card-hover p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900">{formation.name}</h3>
                    <span className="inline-block mt-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      {formation.domain}
                    </span>
                    {formation.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{formation.description}</p>
                    )}
                  </button>
                ))}
              </div>

              {filteredFormations.length === 0 && (
                <div className="text-center py-8 card">
                  <p className="text-sm text-slate-500">Aucune formation trouvée.</p>
                  <button
                    type="button"
                    onClick={() => setRequestType(RequestType.NOUVELLE)}
                    className="mt-2 text-violet-600 hover:text-violet-800 text-xs font-medium"
                  >
                    Proposer une nouvelle formation
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Selected formation confirmed */
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-violet-600 font-medium">Formation sélectionnée</p>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1">{selectedFormation.name}</h3>
                  <span className="inline-block mt-1 text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-medium">
                    {selectedFormation.domain}
                  </span>
                  {selectedFormation.description && (
                    <p className="text-xs text-slate-500 mt-2">{selectedFormation.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-slate-500 hover:text-red-600 font-medium"
                >
                  Changer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOUVELLE MODE: Custom fields */}
      {requestType === RequestType.NOUVELLE && (
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom de la formation
            </label>
            <input
              type="text"
              value={customFormationName}
              onChange={(e) => setCustomFormationName(e.target.value)}
              required
              className="input-field"
              placeholder="Ex: Formation Docker Avancé"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Domaine
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="input-field"
            >
              <option value="">Sélectionner un domaine</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Form: Dates + Justification + Submit (shown when selection is made or in NOUVELLE mode) */}
      {(requestType === RequestType.NOUVELLE || selectedFormation) && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{error}</div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date de début souhaitée
              </label>
              <input
                type="date"
                value={desiredStartDate}
                onChange={(e) => setDesiredStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date de fin (optionnelle)
              </label>
              <input
                type="date"
                value={desiredEndDate}
                onChange={(e) => setDesiredEndDate(e.target.value)}
                min={desiredStartDate || new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Justification (optionnelle)
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Pourquoi cette formation est-elle nécessaire ?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? 'Création en cours...' : 'Soumettre la demande'}
          </button>
        </form>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trainingRequestService } from '../services/training-request.service';
import { analyticsService } from '../services/analytics.service';
import { useAuth } from '../contexts/AuthContext';
import { TrainingRequest, RequestStatus, UserRole } from '../types';

export function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await trainingRequestService.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Voulez-vous vraiment annuler cette demande ?')) return;
    try {
      await trainingRequestService.cancel(id);
      loadRequests();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesType = !typeFilter || r.requestType === typeFilter;
    return matchesStatus && matchesType;
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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">Mes demandes</h1>
        <div className="flex gap-2">
          {(user?.role === UserRole.RH || user?.role === UserRole.ADMIN) && (
            <button
              onClick={() => analyticsService.exportCsv(statusFilter || undefined)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exporter CSV
            </button>
          )}
          <Link to="/create-request" className="btn-primary">
            Nouvelle demande
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">Tous les statuts</option>
          <option value={RequestStatus.EN_ATTENTE_MANAGER}>En attente Manager</option>
          <option value={RequestStatus.EN_ATTENTE_RH}>En attente RH</option>
          <option value={RequestStatus.APPROUVEE}>Approuvée</option>
          <option value={RequestStatus.REFUSEE_MANAGER}>Refusée Manager</option>
          <option value={RequestStatus.REFUSEE_RH}>Refusée RH</option>
          <option value={RequestStatus.ANNULEE}>Annulée</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">Tous les types</option>
          <option value="CATALOGUE">Catalogue</option>
          <option value="NOUVELLE">Nouvelle</option>
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Requests list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-slate-500">Aucune demande trouvée.</p>
          <Link to="/create-request" className="text-blue-600 hover:underline text-xs mt-2 inline-block">
            Créer votre première demande
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((request) => (
            <Link
              key={request.id}
              to={`/requests/${request.id}`}
              className="card-hover block"
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-slate-900 truncate">
                      {request.formation?.name || request.customFormationName || 'Formation'}
                    </h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                    <span>Début: {new Date(request.desiredStartDate).toLocaleDateString('fr-FR')}</span>
                    <span>{request.requestType === 'CATALOGUE' ? 'Catalogue' : 'Nouvelle'}</span>
                    <span>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {!['APPROUVEE', 'ANNULEE', 'REFUSEE_MANAGER', 'REFUSEE_RH'].includes(request.status) && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleCancel(request.id); }}
                      className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    [RequestStatus.BROUILLON]: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600' },
    [RequestStatus.EN_ATTENTE_MANAGER]: { label: 'Manager', className: 'bg-amber-100 text-amber-700' },
    [RequestStatus.EN_ATTENTE_RH]: { label: 'RH', className: 'bg-orange-100 text-orange-700' },
    [RequestStatus.APPROUVEE]: { label: 'Approuvée', className: 'bg-emerald-100 text-emerald-700' },
    [RequestStatus.REFUSEE_MANAGER]: { label: 'Refusée', className: 'bg-red-100 text-red-700' },
    [RequestStatus.REFUSEE_RH]: { label: 'Refusée', className: 'bg-red-100 text-red-700' },
    [RequestStatus.ANNULEE]: { label: 'Annulée', className: 'bg-slate-100 text-slate-500' },
  };
  const c = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.className}`}>{c.label}</span>;
}

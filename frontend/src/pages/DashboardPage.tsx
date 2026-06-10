import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trainingRequestService } from '../services/training-request.service';
import { decisionService } from '../services/decision.service';
import { TrainingRequest, UserRole, RequestStatus } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TrainingRequest[]>([]);
  const [pendingTasks, setPendingTasks] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const data = await trainingRequestService.getAll();
      setRequests(data);

      if (user?.role === UserRole.MANAGER) {
        const tasks = await decisionService.getManagerTasks();
        setPendingTasks(tasks);
      } else if (user?.role === UserRole.RH || user?.role === UserRole.ADMIN) {
        const tasks = await decisionService.getRhTasks();
        setPendingTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const myRequests = requests.filter((r) => r.createdBy === user?.id);
  const stats = {
    total: myRequests.length,
    pending: myRequests.filter(
      (r) => r.status === RequestStatus.EN_ATTENTE_MANAGER || r.status === RequestStatus.EN_ATTENTE_RH,
    ).length,
    approved: myRequests.filter((r) => r.status === RequestStatus.APPROUVEE).length,
    rejected: myRequests.filter(
      (r) => r.status === RequestStatus.REFUSEE_MANAGER || r.status === RequestStatus.REFUSEE_RH,
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bonjour, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{getWelcomeMessage(user?.role)}</p>
      </div>

      {/* Pending tasks alert */}
      {pendingTasks.length > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {pendingTasks.length} demande{pendingTasks.length > 1 ? 's' : ''} en attente de validation
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pendingTasks.slice(0, 2).map((t) => t.formation?.name || t.customFormationName).join(', ')}
                  {pendingTasks.length > 2 && ` +${pendingTasks.length - 2}`}
                </p>
              </div>
            </div>
            <Link
              to={user?.role === UserRole.MANAGER ? '/manager-validation' : '/rh-validation'}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Traiter
            </Link>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total demandes" value={stats.total} trend="neutral" />
        <MetricCard label="En cours" value={stats.pending} trend="warning" />
        <MetricCard label="Approuvées" value={stats.approved} trend="success" />
        <MetricCard label="Refusées" value={stats.rejected} trend="danger" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent requests */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-900">Demandes récentes</h2>
            <Link to="/my-requests" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Tout voir
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {myRequests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">Aucune demande pour le moment</p>
                <Link to="/create-request" className="btn-primary text-xs mt-3 inline-block">
                  Créer une demande
                </Link>
              </div>
            ) : (
              myRequests.slice(0, 6).map((request) => (
                <Link
                  key={request.id}
                  to={`/requests/${request.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {request.formation?.name || request.customFormationName || 'Formation'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(request.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      {request.requestType === 'CATALOGUE' ? 'Catalogue' : 'Nouvelle'}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <QuickAction to="/create-request" label="Nouvelle demande" desc="Soumettre une demande de formation" />
              <QuickAction to="/formations" label="Consulter le catalogue" desc="Parcourir les formations disponibles" />
              <QuickAction to="/chat" label="Assistant IA" desc="Obtenir des recommandations" />
            </div>
          </div>

          {/* Team panel for Manager/RH */}
          {(user?.role === UserRole.MANAGER || user?.role === UserRole.RH || user?.role === UserRole.ADMIN) && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Activité équipe</h3>
              <div className="space-y-2">
                {requests.filter((r) => r.createdBy !== user?.id).slice(0, 4).map((request) => (
                  <Link
                    key={request.id}
                    to={`/requests/${request.id}`}
                    className="block p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {request.formation?.name || request.customFormationName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {request.createdByUser?.firstName} {request.createdByUser?.lastName}
                    </p>
                  </Link>
                ))}
                {requests.filter((r) => r.createdBy !== user?.id).length === 0 && (
                  <p className="text-xs text-slate-400">Aucune demande d'équipe</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: number; trend: 'neutral' | 'warning' | 'success' | 'danger' }) {
  const colors = {
    neutral: 'bg-slate-50 text-slate-900',
    warning: 'bg-amber-50 text-amber-900',
    success: 'bg-emerald-50 text-emerald-900',
    danger: 'bg-red-50 text-red-900',
  };
  const dotColors = {
    neutral: 'bg-slate-400',
    warning: 'bg-amber-400',
    success: 'bg-emerald-400',
    danger: 'bg-red-400',
  };

  return (
    <div className={`rounded-xl p-4 ${colors[trend]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dotColors[trend]}`} />
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuickAction({ to, label, desc }: { to: string; label: string; desc: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-2.5 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center flex-shrink-0 transition-colors">
        <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
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
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

function getWelcomeMessage(role?: UserRole): string {
  switch (role) {
    case UserRole.MANAGER: return 'Gérez les demandes de votre équipe et suivez leur progression.';
    case UserRole.RH: return 'Validez les demandes et administrez le catalogue de formations.';
    case UserRole.ADMIN: return "Vue d'ensemble de toutes les demandes et formations.";
    default: return 'Consultez vos demandes de formation et explorez le catalogue.';
  }
}

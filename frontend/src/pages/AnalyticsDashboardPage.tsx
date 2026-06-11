import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analytics.service';
import { AnalyticsDashboard } from '../types';

export function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboard().then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent"></div>
    </div>
  );

  if (!data) return <p className="text-slate-500 text-center py-10">Erreur lors du chargement des statistiques.</p>;

  const statusLabels: Record<string, string> = {
    BROUILLON: 'Brouillon',
    EN_ATTENTE_MANAGER: 'Attente Manager',
    EN_ATTENTE_RH: 'Attente RH',
    APPROUVEE: 'Approuv\u00e9e',
    REFUSEE_MANAGER: 'Refus\u00e9e Manager',
    REFUSEE_RH: 'Refus\u00e9e RH',
    ANNULEE: 'Annul\u00e9e',
  };

  const statusColors: Record<string, string> = {
    BROUILLON: 'bg-slate-400',
    EN_ATTENTE_MANAGER: 'bg-amber-400',
    EN_ATTENTE_RH: 'bg-orange-400',
    APPROUVEE: 'bg-emerald-500',
    REFUSEE_MANAGER: 'bg-red-400',
    REFUSEE_RH: 'bg-red-500',
    ANNULEE: 'bg-slate-300',
  };

  const totalRequests = data.statusDistribution.reduce((sum, s) => sum + parseInt(s.count), 0);
  const budgetUsagePercent = data.totalEnvelope > 0
    ? Math.min(100, Math.round((data.engagedBudget / data.totalEnvelope) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tableau de bord analytique</h1>
        <p className="text-sm text-slate-500 mt-1">Vue d'ensemble des formations et du budget.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Taux d'approbation"
          value={`${data.approvalRate}%`}
          color="emerald"
        />
        <KpiCard
          label="D\u00e9lai moyen traitement"
          value={`${data.avgProcessingDays}j`}
          color="blue"
        />
        <KpiCard
          label="Budget engag\u00e9"
          value={`${Number(data.engagedBudget).toLocaleString('fr-FR')} DA`}
          color="amber"
        />
        <KpiCard
          label="Enveloppe totale"
          value={`${Number(data.totalEnvelope).toLocaleString('fr-FR')} DA`}
          color="slate"
        />
      </div>

      {/* Budget Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">Utilisation du budget</h2>
          <span className="text-xs text-slate-500">{budgetUsagePercent}% utilis\u00e9</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${budgetUsagePercent > 80 ? 'bg-red-500' : budgetUsagePercent > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${budgetUsagePercent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">
          {Number(data.engagedBudget).toLocaleString('fr-FR')} DA engag\u00e9s sur {Number(data.totalEnvelope).toLocaleString('fr-FR')} DA disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Formations */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Formations les plus demand\u00e9es</h2>
          {data.topFormations.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune donn\u00e9e disponible.</p>
          ) : (
            <div className="space-y-3">
              {data.topFormations.map((f, i) => {
                const maxCount = parseInt(data.topFormations[0]?.count || '1');
                const pct = Math.round((parseInt(f.count) / maxCount) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">{f.formationName}</span>
                      <span className="text-[11px] text-slate-500">{f.count} demande{parseInt(f.count) > 1 ? 's' : ''}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget by Domain */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Budget par domaine</h2>
          {data.budgetByDomain.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune donn\u00e9e disponible.</p>
          ) : (
            <div className="space-y-3">
              {data.budgetByDomain.map((d, i) => {
                const maxBudget = parseFloat(data.budgetByDomain[0]?.totalBudget || '1');
                const pct = maxBudget > 0 ? Math.round((parseFloat(d.totalBudget) / maxBudget) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-700 font-medium">{d.domain || 'Non classé'}</span>
                      <span className="text-[11px] text-slate-500">{Number(parseFloat(d.totalBudget)).toLocaleString('fr-FR')} DA</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">R\u00e9partition par statut</h2>
          <div className="space-y-2.5">
            {data.statusDistribution.map((s, i) => {
              const pct = totalRequests > 0 ? Math.round((parseInt(s.count) / totalRequests) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusColors[s.status] || 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-600 w-32">{statusLabels[s.status] || s.status}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[s.status] || 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-500 w-8 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tendance mensuelle (6 mois)</h2>
          {data.monthlyRequests.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune donn\u00e9e disponible.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {data.monthlyRequests.map((m, i) => {
                const maxCount = Math.max(...data.monthlyRequests.map((x) => parseInt(x.count)));
                const heightPct = maxCount > 0 ? Math.round((parseInt(m.count) / maxCount) * 100) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500">{m.count}</span>
                    <div className="w-full bg-slate-100 rounded-t" style={{ height: '100px', position: 'relative' }}>
                      <div
                        className="absolute bottom-0 w-full bg-violet-500 rounded-t transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-violet-50 border-violet-100',
    amber: 'bg-amber-50 border-amber-100',
    slate: 'bg-slate-50 border-slate-100',
  };
  const dotColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-violet-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.slate}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dotColorMap[color] || dotColorMap.slate}`} />
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

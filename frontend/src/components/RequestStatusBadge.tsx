import { RequestStatus } from '../types';

const statusConfig: Record<RequestStatus, { label: string; color: string }> = {
  [RequestStatus.BROUILLON]: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  [RequestStatus.EN_ATTENTE_MANAGER]: { label: 'Attente Manager', color: 'bg-yellow-100 text-yellow-800' },
  [RequestStatus.REFUSEE_MANAGER]: { label: 'Refusée (Manager)', color: 'bg-red-100 text-red-800' },
  [RequestStatus.EN_ATTENTE_RH]: { label: 'Attente RH', color: 'bg-blue-100 text-blue-800' },
  [RequestStatus.REFUSEE_RH]: { label: 'Refusée (RH)', color: 'bg-red-100 text-red-800' },
  [RequestStatus.APPROUVEE]: { label: 'Approuvée', color: 'bg-green-100 text-green-800' },
  [RequestStatus.ANNULEE]: { label: 'Annulée', color: 'bg-gray-100 text-gray-500' },
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

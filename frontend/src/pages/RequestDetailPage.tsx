import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { trainingRequestService } from '../services/training-request.service';
import { decisionService } from '../services/decision.service';
import { commentService } from '../services/comment.service';
import { TrainingRequest, RequestStatus, UserRole, Comment as CommentType } from '../types';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<TrainingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequest();
      loadComments();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await trainingRequestService.getById(id!);
      setRequest(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await commentService.getByRequest(id!);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const created = await commentService.create(id!, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleApprove = async (role: 'manager' | 'rh') => {
    setActionLoading(true);
    try {
      if (role === 'manager') {
        await decisionService.approveAsManager(id!, comment);
      } else {
        await decisionService.approveAsRh(id!, comment);
      }
      setComment('');
      loadRequest();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (role: 'manager' | 'rh') => {
    setActionLoading(true);
    try {
      if (role === 'manager') {
        await decisionService.rejectAsManager(id!, comment);
      } else {
        await decisionService.rejectAsRh(id!, comment);
      }
      setComment('');
      loadRequest();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Annuler cette demande ?')) return;
    try {
      await trainingRequestService.cancel(id!);
      loadRequest();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Demande non trouvée.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">← Retour</button>
      </div>
    );
  }

  const canValidateAsManager = user?.role === UserRole.MANAGER && request.status === RequestStatus.EN_ATTENTE_MANAGER;
  const canValidateAsRh = (user?.role === UserRole.RH || user?.role === UserRole.ADMIN) && request.status === RequestStatus.EN_ATTENTE_RH;
  const canCancel = request.createdBy === user?.id && request.status !== RequestStatus.APPROUVEE && request.status !== RequestStatus.ANNULEE;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
          <span>←</span>
          <span>Retour</span>
        </button>
        <StatusBadgeLarge status={request.status} />
      </div>

      {/* Main info card */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            {request.formation?.name || request.customFormationName || 'Formation'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Demande #{request.id.slice(0, 8)} • Créée le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem label="Type de demande" value={request.requestType === 'CATALOGUE' ? 'Depuis le catalogue' : 'Nouvelle formation'} />
          <InfoItem label="Portée" value={request.requestScope === 'TEAM' ? 'Équipe' : 'Individuelle'} />
          <InfoItem label="Domaine" value={request.formation?.domain || request.domain || '—'} />
          <InfoItem label="Demandeur" value={`${request.createdByUser?.firstName || ''} ${request.createdByUser?.lastName || ''}`} />
          <InfoItem label="Date de début souhaitée" value={new Date(request.desiredStartDate).toLocaleDateString('fr-FR')} />
          <InfoItem label="Date de fin" value={request.desiredEndDate ? new Date(request.desiredEndDate).toLocaleDateString('fr-FR') : '—'} />
        </div>

        {request.justification && (
          <div className="px-6 pb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Justification</p>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{request.justification}</p>
          </div>
        )}
      </div>

      {/* Participants (team requests) */}
      {request.participants && request.participants.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-3">Participants</h2>
          <div className="space-y-2">
            {request.participants.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{p.user?.firstName} {p.user?.lastName}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{p.participantStatus}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline / Decisions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Historique des decisions</h2>
        {(!request.decisions || request.decisions.length === 0) ? (
          <p className="text-gray-500 text-sm">Aucune decision enregistree pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {request.decisions.map((decision) => (
              <div key={decision.id} className="flex items-start space-x-3">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${decision.decision === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {decision.decidedByUser?.firstName} {decision.decidedByUser?.lastName}
                    <span className="text-gray-500 font-normal"> ({decision.decisionRole})</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {decision.decision === 'APPROVED' ? 'Approuvee' : 'Refusee'}
                    {decision.comment && ` — "${decision.comment}"`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(decision.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Commentaires</h2>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">Aucun commentaire pour le moment.</p>
        ) : (
          <div className="space-y-4 mb-4">
            {comments.map((c) => (
              <div key={c.id} className={`flex items-start gap-3 ${c.authorId === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0">
                  {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
                </div>
                <div className={`max-w-[75%] ${c.authorId === user?.id ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'} border rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{c.author?.firstName} {c.author?.lastName}</span>
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-gray-800">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Ecrire un commentaire..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddComment}
            disabled={commentLoading || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </div>

      {/* Action panel for validation */}
      {(canValidateAsManager || canValidateAsRh) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Action requise</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (optionnel)..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 resize-none"
            rows={3}
          />
          <div className="flex space-x-3">
            <button
              onClick={() => handleApprove(canValidateAsManager ? 'manager' : 'rh')}
              disabled={actionLoading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              ✅ Approuver
            </button>
            <button
              onClick={() => handleReject(canValidateAsManager ? 'manager' : 'rh')}
              disabled={actionLoading}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {/* Cancel button for owner */}
      {canCancel && (
        <div className="flex justify-end">
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-800 text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Annuler cette demande
          </button>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function StatusBadgeLarge({ status }: { status: RequestStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    [RequestStatus.BROUILLON]: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
    [RequestStatus.EN_ATTENTE_MANAGER]: { label: 'En attente Manager', className: 'bg-yellow-100 text-yellow-700' },
    [RequestStatus.EN_ATTENTE_RH]: { label: 'En attente RH', className: 'bg-orange-100 text-orange-700' },
    [RequestStatus.APPROUVEE]: { label: 'Approuvée', className: 'bg-green-100 text-green-700' },
    [RequestStatus.REFUSEE_MANAGER]: { label: 'Refusée par Manager', className: 'bg-red-100 text-red-700' },
    [RequestStatus.REFUSEE_RH]: { label: 'Refusée par RH', className: 'bg-red-100 text-red-700' },
    [RequestStatus.ANNULEE]: { label: 'Annulée', className: 'bg-gray-100 text-gray-500' },
  };
  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${c.className}`}>{c.label}</span>;
}

import { useState, useEffect } from 'react';
import { decisionService } from '../services/decision.service';
import { TrainingRequest } from '../types';

export function RhValidationPage() {
  const [tasks, setTasks] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [activeRequest, setActiveRequest] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await decisionService.getRhTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await decisionService.approveAsRh(requestId, comment);
      setComment('');
      setActiveRequest(null);
      loadTasks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await decisionService.rejectAsRh(requestId, comment);
      setComment('');
      setActiveRequest(null);
      loadTasks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validations RH</h1>

      {tasks.length === 0 ? (
        <p className="text-gray-500">Aucune demande à valider.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow p-6">
              <div>
                <h3 className="font-semibold text-lg">
                  {task.formation?.name || task.customFormationName}
                </h3>
                <p className="text-sm text-gray-600">
                  Demandé par : {task.createdByUser?.firstName}{' '}
                  {task.createdByUser?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  Type : {task.requestScope} | Date : {task.desiredStartDate}
                </p>
                {task.participants && task.participants.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Participants :</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {task.participants.map((p) => (
                        <li key={p.id}>
                          {p.user?.firstName} {p.user?.lastName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {task.justification && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Justification :</strong> {task.justification}
                  </p>
                )}
              </div>

              {activeRequest === task.id ? (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Commentaire (optionnel)"
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(task.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(task.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => setActiveRequest(null)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveRequest(task.id)}
                  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                >
                  Traiter cette demande
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

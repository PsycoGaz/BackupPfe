import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { decisionService } from '../services/decision.service';
import { TrainingRequest } from '../types';

export function ManagerValidationPage() {
  const [tasks, setTasks] = useState<TrainingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await decisionService.getManagerTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Validations Manager
      </h1>

      {tasks.length === 0 ? (
        <p className="text-gray-500">Aucune demande a valider.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {task.formation?.name || task.customFormationName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Demande par : {task.createdByUser?.firstName}{' '}
                    {task.createdByUser?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date souhaitee : {task.desiredStartDate}
                  </p>
                  {task.justification && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Justification :</strong> {task.justification}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate(`/requests/${task.id}`)}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
              >
                Traiter cette demande
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
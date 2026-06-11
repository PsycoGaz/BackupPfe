import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingRequestService } from '../services/training-request.service';
import { formationService } from '../services/formation.service';
import { userService } from '../services/user.service';
import { Formation, User, RequestType } from '../types';

export function TeamRequestPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [requestType, setRequestType] = useState<RequestType>(RequestType.CATALOGUE);
  const [formationId, setFormationId] = useState('');
  const [customFormationName, setCustomFormationName] = useState('');
  const [domain, setDomain] = useState('');
  const [desiredStartDate, setDesiredStartDate] = useState('');
  const [desiredEndDate, setDesiredEndDate] = useState('');
  const [justification, setJustification] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    formationService.getAll().then(setFormations);
    userService.getTeam().then(setTeamMembers);
  }, []);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedMembers.length === 0) {
      setError('Sélectionnez au moins un membre de l\'équipe');
      return;
    }

    setLoading(true);
    try {
      await trainingRequestService.createTeamRequest({
        requestType,
        formationId: requestType === RequestType.CATALOGUE ? formationId : undefined,
        customFormationName:
          requestType === RequestType.NOUVELLE ? customFormationName : undefined,
        domain: domain || undefined,
        desiredStartDate,
        desiredEndDate: desiredEndDate || undefined,
        justification: justification || undefined,
        participantIds: selectedMembers,
      });
      navigate('/my-requests');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Demande de formation pour l'équipe
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
        )}

        {/* Team Members Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Membres de l'équipe concernés
          </label>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
            {teamMembers.map((member) => (
              <label key={member.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">
                  {member.firstName} {member.lastName} ({member.email})
                </span>
              </label>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-gray-500 text-sm">Aucun membre dans l'équipe</p>
            )}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de demande
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as RequestType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value={RequestType.CATALOGUE}>Depuis le catalogue</option>
            <option value={RequestType.NOUVELLE}>Nouvelle formation</option>
          </select>
        </div>

        {requestType === RequestType.CATALOGUE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formation
            </label>
            <select
              value={formationId}
              onChange={(e) => setFormationId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Sélectionner une formation</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.domain})
                </option>
              ))}
            </select>
          </div>
        )}

        {requestType === RequestType.NOUVELLE && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la formation
              </label>
              <input
                type="text"
                value={customFormationName}
                onChange={(e) => setCustomFormationName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domaine
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={desiredStartDate}
              onChange={(e) => setDesiredStartDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={desiredEndDate}
              onChange={(e) => setDesiredEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justification
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 text-white py-2 px-4 rounded-md hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer la demande groupée'}
        </button>
      </form>
    </div>
  );
}

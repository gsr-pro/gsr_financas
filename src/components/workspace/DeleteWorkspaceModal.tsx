import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { WorkspaceRow } from '../../types/app';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceRow | null;
  onSuccess?: () => void;
}

export const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onSuccess,
}) => {
  const { workspaces, deleteWorkspace } = useWorkspace();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !workspace) return null;

  const isOnlyWorkspace = workspaces.length <= 1;

  const handleDelete = async () => {
    if (isOnlyWorkspace) return;

    try {
      setLoading(true);
      setError(null);
      await deleteWorkspace(workspace.id);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao excluir workspace:', err);
      const message = err instanceof Error ? err.message : 'Falha ao excluir o ambiente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        {/* Topo / Ícone de Alerta */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título & Identificação */}
        <div>
          <h3 className="text-base font-bold text-white">
            Excluir Ambiente "{workspace.nome}"?
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tipo:{' '}
            <span className="font-semibold text-slate-200">
              {workspace.tipo === 'obra' ? 'Custo de Obra' : 'Finanças Pessoais'}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Caso especial: É o único workspace do usuário */}
        {isOnlyWorkspace ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>Exclusão Bloqueada</span>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Você não pode excluir este ambiente porque ele é o <strong>único workspace ativo</strong> na sua conta.
              Crie outro ambiente antes caso deseje remover este.
            </p>
          </div>
        ) : (
          /* Disclaimer Completo de Exclusão */
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 text-xs text-rose-200">
              <p className="font-bold text-rose-400 flex items-center space-x-1.5">
                <span>⚠️ Disclaimer Importante & Irreversível</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>
                  Os lançamentos financeiros que pertenciam a este ambiente <strong>não serão apagados</strong>,
                  mas ficarão desvinculados deste projeto específico.
                </li>
                <li>
                  Esta ação <strong>não pode ser desfeita</strong> após confirmada.
                </li>
                <li>
                  Se você estava com este ambiente ativo no momento, outro projeto disponível será selecionado automaticamente.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {isOnlyWorkspace ? 'Entendido' : 'Cancelar'}
          </button>

          {!isOnlyWorkspace && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Excluindo...' : 'Sim, Excluir Ambiente'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

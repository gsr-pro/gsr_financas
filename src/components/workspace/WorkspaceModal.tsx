import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { WorkspaceRow, WorkspaceType, TipoImovel } from '../../types/app';
import {
  X,
  Building2,
  Wallet,
  Home,
  MapPin,
  Maximize2,
  DollarSign,
  Calendar,
  AlertCircle,
  Save,
  Plus,
  Briefcase,
} from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceToEdit?: WorkspaceRow | null;
  onSuccess?: (workspace: WorkspaceRow) => void;
}

const TIPO_IMOVEL_OPTIONS: { value: TipoImovel; label: string; icon: string }[] = [
  { value: 'terreno', label: 'Terreno / Lote', icon: '🌱' },
  { value: 'casa', label: 'Casa Residencial', icon: '🏡' },
  { value: 'apartamento', label: 'Apartamento', icon: '🏢' },
  { value: 'chacara', label: 'Chácara / Sítio', icon: '🚜' },
  { value: 'comercial', label: 'Ponto Comercial / Galpão', icon: '🏬' },
  { value: 'reforma', label: 'Reforma / Ampliação', icon: '🔨' },
  { value: 'outro', label: 'Outro Projeto', icon: '📐' },
];

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspaceToEdit,
  onSuccess,
}) => {
  const { createWorkspace, updateWorkspace, currentEnvironment } = useWorkspace();

  const isEditing = Boolean(workspaceToEdit);

  const [nome, setNome] = useState<string>('');
  const [tipo, setTipo] = useState<WorkspaceType>(currentEnvironment);
  const [tipoImovel, setTipoImovel] = useState<TipoImovel>('terreno');
  const [dimensoes, setDimensoes] = useState<string>('');
  const [valorAquisicao, setValorAquisicao] = useState<string>('0');
  const [dataAquisicao, setDataAquisicao] = useState<string>('');
  const [localizacao, setLocalizacao] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceToEdit) {
      setNome(workspaceToEdit.nome || '');
      setTipo(workspaceToEdit.tipo);
      setTipoImovel((workspaceToEdit.tipo_imovel as TipoImovel) || 'terreno');
      setDimensoes(workspaceToEdit.dimensoes_terreno || '');
      setValorAquisicao(
        workspaceToEdit.valor_aquisicao !== undefined && workspaceToEdit.valor_aquisicao !== null
          ? String(workspaceToEdit.valor_aquisicao)
          : '0'
      );
      setDataAquisicao(workspaceToEdit.data_aquisicao || '');
      setLocalizacao(workspaceToEdit.localizacao || '');
    } else {
      setNome('');
      setTipo(currentEnvironment);
      setTipoImovel('terreno');
      setDimensoes('');
      setValorAquisicao('0');
      setDataAquisicao('');
      setLocalizacao('');
    }
    setError(null);
  }, [workspaceToEdit, currentEnvironment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do ambiente.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parsedValor = parseFloat(valorAquisicao.replace(',', '.')) || 0;

      const details: Partial<WorkspaceRow> = {
        tipo,
        tipo_imovel: tipo === 'obra' ? tipoImovel : null,
        dimensoes_terreno: tipo === 'obra' && dimensoes.trim() ? dimensoes.trim() : null,
        valor_aquisicao: tipo === 'obra' ? parsedValor : 0,
        data_aquisicao: tipo === 'obra' && dataAquisicao ? dataAquisicao : null,
        localizacao: tipo === 'obra' && localizacao.trim() ? localizacao.trim() : null,
      };

      let result: WorkspaceRow;
      if (isEditing && workspaceToEdit) {
        result = await updateWorkspace(workspaceToEdit.id, {
          nome: nome.trim(),
          ...details,
        });
      } else {
        result = await createWorkspace(nome.trim(), tipo, details);
      }

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar workspace:', err);
      const message = err instanceof Error ? err.message : 'Falha ao salvar dados do ambiente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                tipo === 'obra'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : tipo === 'negocio'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {tipo === 'obra' ? (
                <Building2 className="w-5 h-5" />
              ) : tipo === 'negocio' ? (
                <Briefcase className="w-5 h-5" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Editar Ambiente' : 'Novo Ambiente / Projeto'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Atualize as informações do seu projeto ou empresa.'
                  : 'Crie um novo ambiente de acompanhamento financeiro.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Nome do Ambiente */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Ambiente / Projeto <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                tipo === 'obra'
                  ? 'Ex: Loteamento Alphaville 14, Minha Casa, Reforma Sala...'
                  : tipo === 'negocio'
                  ? 'Ex: Minha Empresa PME, Ateliê Doçura, Marcenaria Silva...'
                  : 'Ex: Finanças Pessoais da Família, Reserva...'
              }
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* 2. Tipo de Ambiente (Obra vs Pessoal vs Negócio) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Finalidade do Ambiente
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo('obra')}
                className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 text-xs font-bold transition-all ${
                  tipo === 'obra'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Obra</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('pessoal')}
                className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 text-xs font-bold transition-all ${
                  tipo === 'pessoal'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Wallet className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Pessoal</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('negocio')}
                className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 text-xs font-bold transition-all ${
                  tipo === 'negocio'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Briefcase className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Negócio</span>
              </button>
            </div>
          </div>

          {tipo === 'negocio' && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 flex-shrink-0 text-indigo-400" />
              <span>Ambiente corporativo para pequenas empresas: precificação por insumos, markup e ponto de equilíbrio.</span>
            </div>
          )}

          {/* SE FOR OBRA: Campos ricos de imóvel (Terreno, Casa, Apartamento, dimensões, etc.) */}
          {tipo === 'obra' && (
            <div className="pt-3 border-t border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                <Home className="w-3.5 h-3.5" />
                <span>Detalhes do Imóvel / Construção</span>
              </div>

              {/* Tipo de Imóvel */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Tipo de Imóvel
                </label>
                <select
                  value={tipoImovel}
                  onChange={(e) => setTipoImovel(e.target.value as TipoImovel)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {TIPO_IMOVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dimensões / Área */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                    <Maximize2 className="w-3 h-3 text-emerald-400" />
                    <span>Dimensões / Área</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 360 m² (12x30)"
                    value={dimensoes}
                    onChange={(e) => setDimensoes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Valor de Aquisição / Custo Inicial */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Valor de Aquisição (R$)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={valorAquisicao}
                    onChange={(e) => setValorAquisicao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Data de Aquisição / Início */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>Data de Início / Aquisição</span>
                  </label>
                  <input
                    type="date"
                    value={dataAquisicao}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch (_) {}
                    }}
                    onChange={(e) => setDataAquisicao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  />
                </div>

                {/* Localização / Endereço */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Localização / Lote</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Quadra 4, Lote 12 - Jardins"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Criar Ambiente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

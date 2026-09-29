import React from 'react';
import { X, ExternalLink, FileText } from 'lucide-react';

interface ComprovanteModalProps {
  url: string | null;
  descricao: string;
  onClose: () => void;
}

export const ComprovanteModal: React.FC<ComprovanteModalProps> = ({
  url,
  descricao,
  onClose,
}) => {
  if (!url) return null;

  const isPdf = url.toLowerCase().includes('.pdf');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-100">
        {/* Header do Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Comprovante
            </h4>
            <p className="text-sm font-bold text-white truncate max-w-[220px]">
              {descricao}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar comprovante"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo: Imagem ou visualizador de PDF */}
        <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/80 min-h-[260px]">
          {isPdf ? (
            <div className="text-center p-6 space-y-3">
              <FileText className="w-16 h-16 text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                Documento em formato PDF
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition-colors"
              >
                <span>Abrir PDF</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt={`Comprovante de ${descricao}`}
              className="max-h-[55vh] w-auto object-contain rounded-lg shadow-sm border border-slate-800"
              loading="lazy"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <span>Ver em tamanho real</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

import JSZip from 'jszip';
import type { DespesaRow } from '../types/app';
import { formatCurrency, formatDate } from './formatters';

export interface ExportZipOptions {
  mes: number;
  ano: number;
  nomeContribuinte?: string;
  onProgress?: (percent: number, statusText: string) => void;
}

export interface ExportZipResult {
  totalArquivos: number;
  nomeArquivoZip: string;
}

/**
 * Sanitiza strings para uso seguro em nomes de arquivos em qualquer sistema de arquivos.
 */
function sanitizeFileName(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9_\-]/g, '_') // caracteres seguros
    .replace(/_{2,}/g, '_')
    .slice(0, 30);
}

/**
 * Extrai a extensão apropriada da URL ou do MIME type
 */
function getExtensionFromUrl(url: string, contentType?: string | null): string {
  if (contentType) {
    if (contentType.includes('pdf')) return 'pdf';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  }

  const cleanUrl = url.split('?')[0];
  const parts = cleanUrl.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'pdf', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }

  return 'jpg';
}

/**
 * Baixa e compacta em lote todos os comprovantes fiscais do mês/ano
 * com renomeação padronizada para auditoria da Receita Federal.
 */
export async function exportComprovantesZip(
  despesas: DespesaRow[],
  options: ExportZipOptions
): Promise<ExportZipResult> {
  const { mes, ano, nomeContribuinte = 'Contribuinte', onProgress } = options;

  // Filtra despesas do mês/ano de competência
  const despesasDoPeriodo = despesas.filter((d) => {
    const raw = d.data_gasto;
    if (!raw) return false;
    const [y, m] = raw.split('-');
    return Number(y) === ano && Number(m) === mes;
  });

  const despesasComAnexo = despesasDoPeriodo.filter((d) => Boolean(d.foto_comprovante_url));

  if (despesasComAnexo.length === 0) {
    throw new Error('Nenhum comprovante com anexo foi encontrado no período selecionado.');
  }

  onProgress?.(5, 'Inicializando empacotamento ZIP...');

  const zip = new JSZip();
  const folder = zip.folder('comprovantes') || zip;

  const manifestoLines: string[] = [
    '========================================================================',
    'GSR FINANÇAS — MANIFESTO DE COMPROVANTES FISCAIS E AUDITORIA',
    '========================================================================',
    `Contribuinte: ${nomeContribuinte}`,
    `Competência: ${String(mes).padStart(2, '0')}/${ano}`,
    `Data de Empacotamento: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    `Total de Despesas Escrituradas no Mês: ${despesasDoPeriodo.length}`,
    `Total de Comprovantes com Anexo Compactados: ${despesasComAnexo.length}`,
    '------------------------------------------------------------------------',
    'ARQUIVOS ANEXADOS NESTE PACOTE:',
    '------------------------------------------------------------------------',
  ];

  let processados = 0;
  const total = despesasComAnexo.length;

  for (const item of despesasComAnexo) {
    processados++;
    const percent = Math.round(5 + (processados / total) * 75);
    onProgress?.(percent, `Baixando comprovante ${processados} de ${total}...`);

    try {
      const response = await fetch(item.foto_comprovante_url!);
      if (!response.ok) {
        manifestoLines.push(
          `[FALHA DE DOWNLOAD] Data: ${item.data_gasto} | Valor: R$ ${item.valor.toFixed(2)} | Descrição: ${item.descricao} | URL: ${item.foto_comprovante_url}`
        );
        continue;
      }

      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      const ext = getExtensionFromUrl(item.foto_comprovante_url!, contentType);

      const valorFormatado = item.valor.toFixed(2).replace('.', ',');
      const descSanitizada = sanitizeFileName(item.descricao);
      const catSanitizada = sanitizeFileName(item.categoria);
      const shortId = item.id.slice(0, 6);

      // Padrão padronizado de nomenclatura para a contabilidade
      // Exemplo: 2026-05-14_R$450,00_Material_Sacos-Cimento_d4f8e2.jpg
      const fileName = `${item.data_gasto}_R$${valorFormatado}_${catSanitizada}_${descSanitizada}_${shortId}.${ext}`;

      folder.file(fileName, blob);

      manifestoLines.push(
        `Arquivo: ${fileName} | Data: ${formatDate(item.data_gasto)} | Valor: ${formatCurrency(item.valor)} | Categ: ${item.categoria} | Fornecedor: ${item.nome_participante || '-'} (CPF/CNPJ: ${item.cpf_cnpj_participante || 'N/I'}) | Livro Caixa: ${item.is_dedutivel_livro_caixa ? 'DEDUTÍVEL' : 'NÃO DEDUTÍVEL'}`
      );
    } catch (downloadErr) {
      console.warn(`Erro ao baixar anexo da despesa ${item.id}:`, downloadErr);
      manifestoLines.push(
        `[ERRO REDE] ID: ${item.id} | Descrição: ${item.descricao} | Erro ao baixar URL.`
      );
    }
  }

  manifestoLines.push('------------------------------------------------------------------------');
  manifestoLines.push('Este manifesto serve como índice probatório para escrituração contábil.');
  manifestoLines.push('Gerado automaticamente pelo GSR Finanças — Módulo Fiscal Business.');
  manifestoLines.push('========================================================================');

  // Adiciona o Manifesto na raiz do arquivo ZIP
  zip.file('MANIFESTO_COMPROVANTES.txt', manifestoLines.join('\r\n'));

  onProgress?.(85, 'Compactando arquivo ZIP final...');

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      const zipPercent = Math.round(85 + (metadata.percent / 100) * 14);
      onProgress?.(zipPercent, `Comprimindo: ${Math.round(metadata.percent)}%`);
    }
  );

  const safeNome = sanitizeFileName(nomeContribuinte);
  const zipFileName = `Comprovantes_${ano}_${String(mes).padStart(2, '0')}_${safeNome}.zip`;

  onProgress?.(100, 'Download concluído!');

  // Dispara o download no navegador
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', zipFileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  return {
    totalArquivos: total,
    nomeArquivoZip: zipFileName,
  };
}

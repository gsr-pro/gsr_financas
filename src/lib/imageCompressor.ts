/**
 * COMPRESSOR DE IMAGENS NO CLIENTE - GSR FINANÇAS
 * Reduz fotos de câmeras de smartphones de 8MB-12MB para ~350KB no navegador
 * Mantém texto de cupons térmicos e CNPJ perfeitamente legíveis sem gastar plano de dados 4G/5G.
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  taxaEconomiaPct: number;
}

export const comprimirComprovante = async (
  file: File,
  maxDimension = 1600,
  qualidade = 0.75
): Promise<CompressionResult> => {
  // Arquivos PDF não passam por re-renderização em canvas
  if (file.type === 'application/pdf') {
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      originalSizeBytes: file.size,
      compressedSizeBytes: file.size,
      taxaEconomiaPct: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Falha ao instanciar canvas 2D'));

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao gerar blob comprimido'));
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            const originalSize = file.size;
            const compressedSize = compressedFile.size;
            const taxa = Math.round(((originalSize - compressedSize) / originalSize) * 100);

            resolve({
              file: compressedFile,
              previewUrl: URL.createObjectURL(compressedFile),
              originalSizeBytes: originalSize,
              compressedSizeBytes: compressedSize,
              taxaEconomiaPct: Math.max(0, taxa),
            });
          },
          'image/jpeg',
          qualidade
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

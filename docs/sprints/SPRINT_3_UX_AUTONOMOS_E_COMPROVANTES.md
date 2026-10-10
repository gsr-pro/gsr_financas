# 🦁 SPRINT 3 — UX Mobile-First para Autônomos de Campo & Captura Ultrarrápida de Comprovantes

> **Status:** Planejamento Aprovado  
> **Objetivo:** Projetar e implementar a experiência de usuário móvel focada em máxima agilidade para motoristas de aplicativo entre corridas e profissionais da construção civil no canteiro de obras, com compressão inteligente de fotos e preenchimento assistido de dados fiscais.

---

## 📱 1. O Desafio da UX de Campo

O pedreiro com as mãos empoeiradas ou o motorista de aplicativo parado no sinal não podem perder 2 minutos preenchendo um formulário complexo com termos tributários burocráticos.

Se a experiência for demorada:
1. O profissional deixa para lançar no final da semana;
2. Os recibos térmicos de postos de combustível e lojas de materiais apagam com o calor da carteira ou se perdem;
3. O contador recebe uma caixa de sapatos cheia de papel amassado ou um extrato incompleto.

A solução do GSR Finanças é o **Fluxo Expresso em 3 Toques**:
`Tirar Foto do Recibo` ➔ `Digitar Valor e CPF` ➔ `Salvar com Tag Automática`.

---

## 📸 2. Câmera Rápida & Compressão no Cliente (`src/lib/imageCompressor.ts`)

Fotos de celulares modernos ultrapassam facilmente 8MB a 12MB. Enviar esses arquivos em canteiros de obras com sinal 3G/4G instável causa falhas e consome os dados do usuário.

Desenvolveremos um pipeline no navegador que redimensiona e comprime comprovantes para **menos de 400KB**, mantendo nitidez absoluta de textos, CNPJs e valores:

```typescript
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
            if (!blob) return reject(new Error('Falha ao comprimir imagem'));
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

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
```

---

## 📝 3. Formulário de Lançamento Inteligente (`ExpenseFormView.tsx`)

### 3.1. Máscara & Validação de CPF em Tempo Real
Quando o tipo de movimentação for **Receita** ou o ambiente for **Negócio/Autônomo**:
- Campo com máscara dinâmica `000.000.000-00`;
- Validação no evento `onChange` que aciona um badge visual instantâneo:
  - 🟢 **CPF Válido:** Ícone de confirmação com visual verde neon.
  - 🔴 **CPF Incompleto ou com Dígito Inválido:** Alerta sutil explicando o erro de digitação antes de enviar.

### 3.2. Switcher "Dedutível no Carnê-Leão (Abate Imposto de Renda)"
- Quando o usuário seleciona categorias elegíveis (ex: *Ferramentas, Manutenção do Carro, Combustível, EPIs, Andaimes*), o toggle de dedutibilidade é ativado por padrão.
- Um card contextual didático explica:
  > 💡 *"Este gasto será lançado no seu Livro Caixa Oficial. Ele reduz diretamente a base de cálculo do seu imposto mensal (DARF)."*
- Se o usuário tentar marcar como dedutível uma categoria de alimentação ou lazer, um aviso imediato orienta a desmarcação para evitar retenção na malha fina.

---

## 🏷️ 4. Extrato & Histórico com Badges de Compliance

No componente [ExpenseListView.tsx](file:///c:/Users/gabriel.rocha/source/repos/gsr_financas/src/views/ExpenseListView.tsx), cada item exibe chips informativos que orientam o usuário:

1. **Tag de Dedutibilidade:**
   - `Livro Caixa` (Verde Esmeralda): Abate no imposto de renda.
   - `Gasto Pessoal` (Cinza): Lançamento comum sem efeito no Carnê-Leão.
2. **Status Documental:**
   - 📎 **Comprovante Anexo:** Ícone de foto que abre o modal de inspeção.
   - ⚠️ **Sem Comprovante:** Alerta amarelo piscante para lembrar o usuário de anexar a nota fiscal antes do fim do mês.
3. **Status de CPF:**
   - `CPF: 123.***.***-00` em receitas comprovadas.
   - `⚠️ CPF Pendente` em receitas que exigem o dado da contraparte.

---

## ✅ 5. Critérios de Aceite do Sprint 3
- [ ] Upload de fotos de 8MB comprimidas em menos de 1 segundo para ~300KB no próprio celular sem perda de texto legível.
- [ ] Campo de CPF com máscara fluida sem saltos de cursor no mobile.
- [ ] Sugestão automática de dedutibilidade conforme a categoria selecionada.
- [ ] Extrato financeiro destacando lançamentos com inconsistências e comprovantes ausentes.

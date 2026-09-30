#!/usr/bin/env node
/**
 * Setup Automatizado de Produtos, Preços e Cupons no Stripe
 * Execução: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs
 * 
 * Requisitos: Node.js 18+ (usa fetch nativo, sem dependências externas)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('\x1b[31m%s\x1b[0m', 'ERRO: A variável STRIPE_SECRET_KEY não foi informada.');
  console.log('\nComo executar:');
  console.log('  STRIPE_SECRET_KEY=sk_test_sua_chave_aqui node scripts/setup-stripe.mjs\n');
  process.exit(1);
}

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

async function stripeRequest(endpoint, method = 'POST', data = null) {
  const headers = {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  let body = undefined;
  if (data && method === 'POST') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    body = params.toString();
  }

  const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, {
    method,
    headers,
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    const errorMsg = json.error ? json.error.message : JSON.stringify(json);
    throw new Error(`[Stripe API ${response.status}] ${errorMsg}`);
  }

  return json;
}

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
  console.log('\x1b[32m%s\x1b[0m', '  GESTÃO FINANCEIRA - PROVISIONAMENTO STRIPE AUTOMÁTICO');
  console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Criar Produto Principal: "Gestão Completa Pro"
    console.log('\x1b[33m%s\x1b[0m', '1/4. Criando Produto no Stripe...');
    const product = await stripeRequest('/products', 'POST', {
      'name': 'Gestão Completa Pro',
      'description': 'Controle financeiro integrado de obras e finanças pessoais com múltiplos ambientes e comprovantes.',
      'statement_descriptor': 'GESTAO PRO',
      'metadata[app]': 'custo_terreno',
      'metadata[trial_days]': '7',
    });
    console.log(`   ✔ Produto criado: \x1b[32m${product.id}\x1b[0m (${product.name})`);

    // 2. Criar Preço Mensal: R$ 14,90/mês
    console.log('\x1b[33m%s\x1b[0m', '\n2/4. Criando Preço Mensal (R$ 14,90/mês)...');
    const monthlyPrice = await stripeRequest('/prices', 'POST', {
      'product': product.id,
      'unit_amount': '1490', // R$ 14,90 em centavos
      'currency': 'brl',
      'recurring[interval]': 'month',
      'nickname': 'Mensal - Gestão Completa Pro',
      'metadata[plan]': 'obra_mensal',
    });
    console.log(`   ✔ Preço Mensal criado: \x1b[32m${monthlyPrice.id}\x1b[0m (R$ 14,90/mês)`);

    // 3. Criar Preço Anual: R$ 149,00/ano (2 meses grátis)
    console.log('\x1b[33m%s\x1b[0m', '\n3/4. Criando Preço Anual (R$ 149,00/ano)...');
    const yearlyPrice = await stripeRequest('/prices', 'POST', {
      'product': product.id,
      'unit_amount': '14900', // R$ 149,00 em centavos
      'currency': 'brl',
      'recurring[interval]': 'year',
      'nickname': 'Anual - Gestão Completa Pro',
      'metadata[plan]': 'obra_anual',
    });
    console.log(`   ✔ Preço Anual criado: \x1b[32m${yearlyPrice.id}\x1b[0m (R$ 149,00/ano)`);

    // 4. Criar Cupom de 50% de desconto nos 2 primeiros meses
    console.log('\x1b[33m%s\x1b[0m', '\n4/4. Criando Cupom Recorrente de 50% nos 2 primeiros meses...');
    let coupon;
    try {
      coupon = await stripeRequest('/coupons', 'POST', {
        'id': 'PROMO50_2M',
        'name': '50% OFF nos 2 Primeiros Meses',
        'percent_off': '50',
        'duration': 'repeating',
        'duration_in_months': '2',
        'currency': 'brl',
        'metadata[description]': 'Desconto promocional de lançamento de 50% nos 2 primeiros meses',
      });
      console.log(`   ✔ Cupom criado com sucesso: \x1b[32m${coupon.id}\x1b[0m (50% OFF por 2 meses)`);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('resource_already_exists')) {
        console.log(`   ℹ Cupom \x1b[36mPROMO50_2M\x1b[0m já existe no Stripe e será reutilizado.`);
        coupon = { id: 'PROMO50_2M' };
      } else {
        throw err;
      }
    }

    // 5. Atualizar automaticamente src/config/plans.ts com os novos IDs
    const plansFilePath = resolve(process.cwd(), 'src/config/plans.ts');
    try {
      let plansContent = readFileSync(plansFilePath, 'utf-8');
      plansContent = plansContent.replace(
        /monthlyPriceId: '.*?'/g,
        `monthlyPriceId: '${monthlyPrice.id}'`
      );
      plansContent = plansContent.replace(
        /yearlyPriceId: '.*?'/g,
        `yearlyPriceId: '${yearlyPrice.id}'`
      );
      writeFileSync(plansFilePath, plansContent, 'utf-8');
      console.log('\n\x1b[32m%s\x1b[0m', '✔ Arquivo src/config/plans.ts atualizado automaticamente com os Price IDs reais!');
    } catch (fileErr) {
      console.log('\n\x1b[33m%s\x1b[0m', 'Nota: Atualize manualmente src/config/plans.ts com:');
      console.log(`  monthlyPriceId: '${monthlyPrice.id}'`);
      console.log(`  yearlyPriceId: '${yearlyPrice.id}'`);
    }

    console.log('\n\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
    console.log('\x1b[32m%s\x1b[0m', '  PROVISIONAMENTO CONCLUÍDO COM SUCESSO!');
    console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
    console.log(`  Product ID:        ${product.id}`);
    console.log(`  Monthly Price ID:  ${monthlyPrice.id} (R$ 14,90/mês)`);
    console.log(`  Yearly Price ID:   ${yearlyPrice.id} (R$ 149,00/ano)`);
    console.log(`  Promo Coupon ID:   ${coupon.id} (50% OFF nos 2 primeiros meses)`);
    console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n\x1b[31m%s\x1b[0m', `ERRO ao provisionar na Stripe: ${error.message}`);
    process.exit(1);
  }
}

main();

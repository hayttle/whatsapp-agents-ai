#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração do ambiente...\n');

// Verificar se existe arquivo .env
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

let envFile = null;
if (fs.existsSync(envLocalPath)) {
  envFile = envLocalPath;
  console.log('✅ Arquivo .env.local encontrado');
} else if (fs.existsSync(envPath)) {
  envFile = envPath;
  console.log('✅ Arquivo .env encontrado');
} else {
  console.log('❌ Nenhum arquivo .env encontrado');
  console.log('📝 Crie um arquivo .env.local com as seguintes variáveis:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase');
  process.exit(1);
}

// Ler e verificar variáveis
const envContent = fs.readFileSync(envFile, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    acc[key.trim()] = valueParts.join('=').trim();
  }
  return acc;
}, {});

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let allGood = true;

requiredVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName} configurada`);
  } else {
    console.log(`❌ ${varName} não encontrada`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\n🎉 Todas as variáveis de ambiente estão configuradas!');
  console.log('🚀 Você pode iniciar o servidor com: npm run dev');
} else {
  console.log('\n❌ Algumas variáveis estão faltando.');
  console.log('📝 Adicione as variáveis faltantes ao arquivo .env.local');
  process.exit(1);
} 
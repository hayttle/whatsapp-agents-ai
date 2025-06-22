export default function EnvTest() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Teste de Variáveis de Ambiente</h1>
      <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'}</div>
      <div>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'undefined'}</div>
    </div>
  );
} 
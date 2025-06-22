export default function TestColorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-8">Teste de Cores da Marca</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cores Verdes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-brand-gray-dark">Cores Verdes</h2>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-green-light rounded-lg"></div>
                <div>
                  <p className="font-medium">brand-green-light</p>
                  <p className="text-sm text-gray-600">#3BA863</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-green rounded-lg"></div>
                <div>
                  <p className="font-medium">brand-green (DEFAULT)</p>
                  <p className="text-sm text-gray-600">#25D366</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cores Cinzas */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-brand-gray-dark">Cores Cinzas</h2>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-gray-dark rounded-lg"></div>
                <div>
                  <p className="font-medium">brand-gray-dark</p>
                  <p className="text-sm text-gray-600">#2B332E</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Exemplos de Uso */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-brand-gray-dark mb-6">Exemplos de Uso</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-2">Botão Primário</h3>
              <button className="w-full bg-brand-green-light hover:bg-brand-green-medium text-white font-semibold py-2 px-4 rounded-md transition-colors">
                Botão Verde
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-2">Texto da Marca</h3>
              <p className="text-brand-gray-dark">Este é um texto usando a cor da marca.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-brand-gray-dark mb-2">Card da Marca</h3>
              <div className="bg-brand-gray-deep text-white p-4 rounded-md">
                <p>Card com fundo cinza escuro da marca</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
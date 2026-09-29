import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import type { TabType } from './types/app';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { ExpenseFormView } from './views/ExpenseFormView';
import { ExpenseListView } from './views/ExpenseListView';
import { AuthView } from './views/AuthView';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Monitora a sessão ativa no Supabase
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSessionUser(session?.user?.email || null);
      } finally {
        setAuthChecking(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user?.email || null);
      setAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const handleExpenseCreated = () => {
    // Incrementa trigger para que Dashboard e Histórico busquem dados novos
    setRefreshTrigger((prev) => prev + 1);
    // Redireciona para o Histórico de lançamentos
    setCurrentTab('historico');
  };

  // Carregamento inicial da sessão
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono tracking-wider">
          Carregando dados da obra...
        </p>
      </div>
    );
  }

  // Se não autenticado, renderiza a tela de login/cadastro
  if (!sessionUser) {
    return <AuthView onAuthSuccess={() => setRefreshTrigger((prev) => prev + 1)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-viewport)] flex justify-center selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Container Mobile-First otimizado para celulares e centrado em telas desktop */}
      <div className="w-full max-w-md min-h-screen bg-[var(--bg-container)] text-[var(--text-primary)] flex flex-col shadow-2xl relative border-x border-[var(--border-color)] transition-colors duration-300">
        {/* Header Superior */}
        <Header
          userEmail={sessionUser}
          onLogout={handleLogout}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Conteúdo Dinâmico por Aba */}
        <main className="flex-1 p-4 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToForm={() => setCurrentTab('novo')}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentTab === 'novo' && (
            <ExpenseFormView onSuccess={handleExpenseCreated} />
          )}

          {currentTab === 'historico' && (
            <ExpenseListView
              onNavigateToForm={() => setCurrentTab('novo')}
              refreshTrigger={refreshTrigger}
              onExpenseUpdated={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )}
        </main>

        {/* Barra de Navegação Inferior Fixa */}
        <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />
      </div>
    </div>
  );
};

export default App;

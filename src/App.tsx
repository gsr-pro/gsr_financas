import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import type { TabType } from './types/app';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { ExpenseFormView } from './views/ExpenseFormView';
import { ExpenseListView } from './views/ExpenseListView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { SubscriptionGate } from './components/subscription/SubscriptionGate';
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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSessionUser(session?.user?.email || null);
      } finally {
        setAuthChecking(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    setRefreshTrigger((prev) => prev + 1);
    setCurrentTab('historico');
  };

  // Carregamento inicial da sessão
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070D1E] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 font-mono tracking-wider">
          Sincronizando ecossistema SaaS...
        </p>
      </div>
    );
  }

  // Se não autenticado, renderiza a Landing Page SaaS com Login Superior integrado
  if (!sessionUser) {
    return <AuthView onAuthSuccess={() => setRefreshTrigger((prev) => prev + 1)} />;
  }

  return (
    <SubscriptionGate>
      <div className="min-h-screen bg-[var(--bg-viewport)] text-[var(--text-primary)] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
        
        {/* Header Superior Responsivo Largo (Desktop + Mobile) com Seletor de Ambiente */}
        <Header
          userEmail={sessionUser}
          onLogout={handleLogout}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
        />

        {/* Área de Conteúdo Adaptativo: Mobile-First + Expansão Fluida Desktop */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToForm={() => setCurrentTab('novo')}
              onNavigateToHistory={() => setCurrentTab('historico')}
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

          {currentTab === 'configuracoes' && <SettingsView />}
        </main>

        {/* Barra de Navegação Inferior (Fixa para Dispositivos Móveis) */}
        <BottomNav currentTab={currentTab} onChangeTab={setCurrentTab} />
      </div>
    </SubscriptionGate>
  );
};

export default App;

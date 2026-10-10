import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import type { TabType } from './types/app';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { ExpenseFormView } from './views/ExpenseFormView';
import { ExpenseListView } from './views/ExpenseListView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';
import { ContadorWorkspaceView } from './views/ContadorWorkspaceView';
import { SubscriptionGate } from './components/subscription/SubscriptionGate';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';
import type { UserRole } from './components/auth/LoginModal';
import { Loader2 } from 'lucide-react';

interface AuthUserData {
  email: string;
  name: string;
}

export const App: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<AuthUserData | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState<boolean>(false);
  const [userHasContadorProfile, setUserHasContadorProfile] = useState<boolean>(false);

  // Persona ativa (Usuário/Empresa vs Contador)
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('gsr_active_role');
    return saved === 'contador' ? 'contador' : 'usuario';
  });

  // Detecta se a URL contém token de recuperação de senha ao carregar
  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery')) {
      setResetPasswordOpen(true);
    }
  }, []);

  // Monitora a sessão ativa no Supabase
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (user?.email) {
          const metadataName = (user.user_metadata?.nome || user.user_metadata?.full_name || '') as string;
          setSessionUser({
            email: user.email,
            name: metadataName || user.email.split('@')[0],
          });
        } else {
          setSessionUser(null);
        }
      } finally {
        setAuthChecking(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setResetPasswordOpen(true);
      }
      const user = session?.user;
      if (user?.email) {
        const metadataName = (user.user_metadata?.nome || user.user_metadata?.full_name || '') as string;
        setSessionUser({
          email: user.email,
          name: metadataName || user.email.split('@')[0],
        });
      } else {
        setSessionUser(null);
      }
      setAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Consulta o tipo de perfil no banco para oferecer alternância suave
  useEffect(() => {
    if (sessionUser?.email) {
      supabase
        .from('perfis')
        .select('tipo_perfil')
        .eq('email', sessionUser.email)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.tipo_perfil === 'contador') {
            setUserHasContadorProfile(true);
          }
        });
    }
  }, [sessionUser]);

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

  // Se não autenticado, renderiza a Landing Page SaaS com Login e Cadastro Dedicados
  if (!sessionUser) {
    return (
      <>
        <AuthView
          onAuthSuccess={(role?: UserRole) => {
            if (role) {
              setActiveRole(role);
              localStorage.setItem('gsr_active_role', role);
            }
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
        <ResetPasswordModal
          isOpen={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          onSuccess={() => setResetPasswordOpen(false)}
        />
      </>
    );
  }

  // =========================================================================
  // PERSONA CONTADOR: Renderiza diretamente o Workspace Multi-Cliente
  // =========================================================================
  if (activeRole === 'contador') {
    return (
      <ContadorWorkspaceView
        onSwitchToUserView={() => {
          setActiveRole('usuario');
          localStorage.setItem('gsr_active_role', 'usuario');
        }}
        onLogout={handleLogout}
      />
    );
  }

  // =========================================================================
  // PERSONA USUÁRIO / EMPRESA: Renderiza o App tradicional (Obra, Pessoal e Negócio)
  // =========================================================================
  return (
    <SubscriptionGate>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-viewport)] text-[var(--text-primary)] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
        
        {/* Header Superior Responsivo Largo (Desktop + Mobile) com Seletor de Ambiente */}
        <Header
          userEmail={sessionUser.email}
          userName={sessionUser.name}
          onLogout={handleLogout}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onSwitchToContadorView={
            userHasContadorProfile
              ? () => {
                  setActiveRole('contador');
                  localStorage.setItem('gsr_active_role', 'contador');
                }
              : undefined
          }
        />

        {/* Menu Lateral Retrátil (Sidebar Drawer) Focado 100% no Usuário Comum */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          userEmail={sessionUser.email}
          userName={sessionUser.name}
          onLogout={handleLogout}
        />

        {/* Área de Conteúdo Adaptativo: Mobile-First + Expansão Fluida Desktop */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 md:pb-8 overflow-x-hidden min-w-0">
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

          {currentTab === 'configuracoes' && (
            <SettingsView
              onProfileUpdated={(updated) => {
                setSessionUser(updated);
              }}
            />
          )}
        </main>

        {/* Barra de Navegação Inferior (Fixa para Dispositivos Móveis) */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {/* Modal de Redefinição de Senha ao Retornar do E-mail */}
        <ResetPasswordModal
          isOpen={resetPasswordOpen}
          onClose={() => setResetPasswordOpen(false)}
          onSuccess={() => setResetPasswordOpen(false)}
        />
      </div>
    </SubscriptionGate>
  );
};

export default App;

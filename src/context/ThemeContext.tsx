import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { ThemeMode } from '../types/app';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (newTheme: ThemeMode) => Promise<void>;
  isLoadingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'obra_chacara_tema_preferido';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Padrão do sistema: 'escuro' (Obsidian CAD Navy)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY) as ThemeMode | null;
    if (cached && (cached === 'leitura' || cached === 'escuro' || cached === 'claro')) {
      return cached;
    }
    return 'escuro';
  });

  const [isLoadingTheme, setIsLoadingTheme] = useState<boolean>(true);

  // Sincroniza o tema preferido com a tabela `perfis` do Supabase
  const loadThemeFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('perfis')
        .select('tema_preferido')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.tema_preferido) {
        const dbTheme = data.tema_preferido as ThemeMode;
        setThemeState(dbTheme);
        localStorage.setItem(LOCAL_STORAGE_KEY, dbTheme);
      }
    } catch (err) {
      console.error('Erro ao recuperar tema do Supabase:', err);
    } finally {
      setIsLoadingTheme(false);
    }
  }, []);

  useEffect(() => {
    loadThemeFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadThemeFromSupabase();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadThemeFromSupabase]);

  // Sincroniza classes no elemento raiz do documento HTML e body
  useEffect(() => {
    document.documentElement.classList.remove('theme-leitura', 'theme-escuro', 'theme-claro');
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Altera o tema: atualiza estado, salva em localStorage e persiste no banco
  const setTheme = async (newTheme: ThemeMode) => {
    // 1. Atualização imediata na UI
    setThemeState(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);

    // 2. Persistência no Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('perfis')
          .update({
            tema_preferido: newTheme,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          console.error('Falha ao persistir tema no Supabase:', error.message);
        }
      }
    } catch (err) {
      console.error('Erro na requisição de persistência do tema:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoadingTheme }}>
      <div data-theme={theme} className={`theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
};

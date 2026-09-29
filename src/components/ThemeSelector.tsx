import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { ThemeMode } from '../types/app';
import { BookOpen, Moon, Sun, Check } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'escuro',
      label: 'Escuro (Padrão)',
      icon: <Moon className="w-4 h-4 text-sky-400" />,
      desc: 'Obsidian CAD Navy de alta tecnologia',
    },
    {
      id: 'leitura',
      label: 'Modo Leitura',
      icon: <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      desc: 'Prancheta arquitetônica, sem reflexo solar',
    },
    {
      id: 'claro',
      label: 'Modo Claro',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      desc: 'Studio Clean executivo com alto contraste',
    },
  ];

  const currentIcon = {
    leitura: <BookOpen className="w-4 h-4" />,
    escuro: <Moon className="w-4 h-4" />,
    claro: <Sun className="w-4 h-4" />,
  }[theme];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Gatilho do Seletor */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Alterar tema de visualização"
        aria-label="Alterar tema"
        className="p-1.5 rounded-xl border transition-all flex items-center space-x-1 text-xs font-medium active:scale-95 theme-toggle-btn"
      >
        <span>{currentIcon}</span>
        <span className="hidden sm:inline capitalize text-[11px] font-semibold">
          {theme}
        </span>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl p-1.5 shadow-2xl z-50 border theme-dropdown-menu animate-fade-in">
          <div className="px-3 py-1.5 border-b border-inherit mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              Tema do Aplicativo
            </p>
            <p className="text-[11px] opacity-80">
              Salvo no Supabase para seu perfil
            </p>
          </div>

          <div className="space-y-1">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'theme-dropdown-item-active font-bold shadow-sm'
                      : 'theme-dropdown-item-hover font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1 rounded-lg bg-black/5 dark:bg-white/5">
                      {t.icon}
                    </div>
                    <div>
                      <p className="leading-tight">{t.label}</p>
                      <p className="text-[10px] opacity-60 leading-tight mt-0.5 font-normal">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

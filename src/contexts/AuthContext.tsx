import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  role: 'admin' | 'reseller' | 'client';
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  is_approved: boolean;
  erp_role: string | null;
  erp_permissions: string[] | null;
  cadastro_completo_em: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isReseller: boolean;
  isClient: boolean;
  /** Aprovado OU admin — a mesma regra do servidor (api/_lib/papel.ts). */
  isApproved: boolean;
  /** Cadastro com tudo que o pedido precisa (trigger nz_marcar_cadastro_completo). */
  cadastroCompleto: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: SignUpMeta) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
}

export interface SignUpMeta {
  full_name: string;
  phone: string;
  role: string;
  company_name?: string;
  cpf_cnpj?: string;
  ie?: string;
  /** Código do afiliado que trouxe este cadastro (?ref=). */
  indicado_por?: string | null;
  /** Endereço, quando o cadastro já tiver (pré-preenchido pelo ERP). */
  address_zip?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
}

const CAMPOS =
  'id, role, full_name, company_name, phone, cpf_cnpj, email, is_approved, erp_role, erp_permissions, cadastro_completo_em';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // `ultimo_acesso_em` uma vez por carga da página, não a cada evento de auth.
  const acessoTocado = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('user_profiles').select(CAMPOS).eq('id', userId).maybeSingle();
    setProfile((data as UserProfile | null) ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) void fetchProfile(s.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void fetchProfile(s.user.id);
        if (!acessoTocado.current) {
          acessoTocado.current = true;
          // Best-effort: falhar aqui não pode derrubar a sessão.
          void supabase.rpc('tocar_acesso').then(
            () => undefined,
            () => undefined
          );
        }
      } else {
        setProfile(null);
        acessoTocado.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { error: error.message };
    return { error: null };
  };

  /**
   * TUDO em uma chamada só. A versão anterior criava o usuário e depois fazia um
   * UPDATE separado com telefone/documento/empresa — se o segundo passo falhasse
   * (rede, aba fechada), o perfil ficava só com nome e e-mail. Agora os metadados
   * vão no signUp e o trigger `handle_new_user` grava o perfil inteiro.
   *
   * `role: 'admin'` nos metadados é ignorado pelo trigger: admin só nasce de um
   * convite registrado pelo servidor.
   */
  const signUp = async (email: string, password: string, meta: SignUpMeta) => {
    const data: Record<string, string> = {
      full_name: meta.full_name.trim(),
      phone: meta.phone.trim(),
      role: meta.role === 'reseller' ? 'reseller' : 'client',
      aceite_termos_em: 'sim',
    };
    const opcionais: (keyof SignUpMeta)[] = [
      'company_name',
      'cpf_cnpj',
      'ie',
      'indicado_por',
      'address_zip',
      'address_street',
      'address_number',
      'address_complement',
      'address_neighborhood',
      'address_city',
      'address_state',
    ];
    for (const k of opcionais) {
      const v = meta[k];
      if (typeof v === 'string' && v.trim()) data[k] = v.trim();
    }

    const { error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data } });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const recarregarPerfil = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const isAdmin = profile?.role === 'admin';
  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isReseller: profile?.role === 'reseller',
    isClient: profile?.role === 'client',
    isApproved: Boolean(profile?.is_approved) || isAdmin,
    cadastroCompleto: Boolean(profile?.cadastro_completo_em),
    signIn,
    signUp,
    signOut,
    recarregarPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

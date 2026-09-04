import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isApproved && profile?.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#fff', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳ Aguardando Aprovação</h2>
        <p style={{ color: '#888', maxWidth: '400px' }}>Seu cadastro foi recebido com sucesso. Um administrador irá revisar e aprovar seu acesso em breve.</p>
      </div>
    );
  }

  // Falha FECHADA: sem perfil carregado não há como saber o papel, então o
  // acesso é negado. A versão anterior tinha `&& profile` nesta condição, o que
  // pulava o gate inteiro quando o perfil vinha null — um usuário sem linha em
  // user_profiles entrava em rota restrita.
  if (allowedRoles) {
    if (!profile || !allowedRoles.includes(profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';

export default function GoogleCallbackPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const data = params.get('data');
    const error = params.get('error');

    if (error || !data) {
      navigate('/login?error=google_failed');
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(data));
      loginWithGoogle(parsed);
      navigate('/dashboard');
    } catch {
      navigate('/login?error=google_failed');
    }
  }, []);

  return <Loader />;
}
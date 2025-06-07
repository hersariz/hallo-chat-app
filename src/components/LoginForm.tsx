'use client';

import { useState } from 'react';
import { auth } from '@/firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { saveUserToFirestore } from '@/lib/users';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Simpan data pengguna ke Firestore
        await saveUserToFirestore(result.user);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Set displayName berdasarkan email
        if (result.user && !result.user.displayName) {
          const username = email.split('@')[0];
          await updateProfile(result.user, {
            displayName: username
          });
        }
        
        // Simpan data pengguna ke Firestore
        await saveUserToFirestore(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat autentikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // Minta akses lengkap ke profil Google, termasuk foto
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Simpan data pengguna ke Firestore termasuk photoURL
      await saveUserToFirestore(result.user);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk dengan Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl animate-scaleIn">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">
          {isLogin ? 'Masuk ke Akun' : 'Buat Akun Baru'}
        </h2>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md animate-fadeIn">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="nama@email.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 text-sm font-medium" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-xs text-primary hover:text-dark">
                Lupa password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-dark text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:bg-opacity-70 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : (
              isLogin ? 'Masuk' : 'Daftar'
            )}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="px-4 text-gray-500 text-xs font-medium">ATAU</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl transition-colors shadow-sm hover:shadow-md"
        >
          <FcGoogle className="text-xl mr-2" />
          Masuk dengan Google
        </button>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-dark text-sm transition-colors"
          >
            {isLogin ? 'Belum punya akun? Daftar sekarang' : 'Sudah punya akun? Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
} 
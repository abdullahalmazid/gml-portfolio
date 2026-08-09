'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const router = useRouter();
  const handleLogin = async () => {
    try { await signInWithEmailAndPassword(auth, email, pass); router.push('/'); } catch (e) { toast.error(e.message); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        <input type="email" placeholder="Email" className="w-full p-3 border rounded" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="w-full p-3 border rounded" onChange={(e) => setPass(e.target.value)} />
        <button onClick={handleLogin} className="w-full py-3 bg-black text-white rounded font-bold">Sign In</button>
      </div>
    </div>
  );
}

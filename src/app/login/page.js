"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "../../../firebaseConfig";

const auth = getAuth(firebaseApp);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-700">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800">Acessar Sistema</h1>
        <p className="text-gray-600 mt-2">Entre com seu e-mail e senha</p>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <form className="mt-6" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="E-mail"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 mt-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg shadow hover:bg-blue-600 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
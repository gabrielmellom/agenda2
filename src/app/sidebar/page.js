"use client";
import { useState, useEffect } from "react";
import { Home, Calendar, DollarSign, Settings, Briefcase, Star, Menu, LogOut, User } from "lucide-react";
import { useRouter } from 'next/navigation';
import MeusServicosPage from "../meus-servicos/page";
import MeusHorarios from "../configurar-horarios/page";
import MinhaAgenda from "../agenda/page";
import Colaborador from "../usuario/page";
import financeiro from "../financeiro/page";
import linkMarcacao from "../link/page";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../../../firebaseConfig";

const auth = getAuth(app);

const CriarLink = () => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">Criar Link de Marcação</h2>
  </div>
);

const menuItems = [
  { name: "Criar Link de Marcação", icon: Home, component: linkMarcacao },
  { name: "Minha Agenda", icon: Calendar, component: MinhaAgenda},
  { name: "Financeiro", icon: DollarSign, component: financeiro },
  { name: "Configuração de Horário", icon: Settings, component: MeusHorarios },
  { name: "Meus Serviços", icon: Briefcase, component: MeusServicosPage },
  { name: "Avaliação e Feedback", icon: Star },
  { name: "Cadastro colaborador", icon: User ,component: Colaborador},
];

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [active, setActive] = useState(menuItems[0].name);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redireciona para a página de login
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!isMounted) {
    return null;
  }

  const ActiveComponent = menuItems.find(item => item.name === active)?.component || CriarLink;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Botão do menu mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-4 bg-white shadow-lg rounded-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar com posicionamento absoluto */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col justify-between
        `}
      >
        <div className="p-5">
          <h1 className="text-xl font-bold mb-6">Sistema de Agenda</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.name}
                className={`flex items-center gap-3 p-3 w-full rounded-lg text-left transition-colors ${
                  active === item.name ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => {
                  setActive(item.name);
                  setIsOpen(false);
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Botão de Logout */}
        <div className="p-5 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="min-h-screen pl-0 md:pl-64 transition-padding duration-200 ease-in-out">
        <div className="p-6 md:p-8">
          <ActiveComponent />
        </div>
      </main>

      {/* Overlay para fechar o menu em mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
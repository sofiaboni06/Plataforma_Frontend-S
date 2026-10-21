import Header from '@/modules/landing/components/Header'; // Ajusta la ruta si tu Header está en otro lado
import '@/modules/landing/styles/landing.css';
import EquipoView from './EquipoView';

export default function EquipoPage() {
  return (
   <main className="lp-root min-h-screen overflow-x-clip font-sans">
     <Header />
     <EquipoView />
   </main>
  );
}
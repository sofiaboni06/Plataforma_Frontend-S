import { useEffect } from 'react'
import Header from '@/modules/landing/components/Header'
import SiteFooter from '@/modules/landing/components/SiteFooter'
import '@/modules/landing/styles/landing.css'
import EquipoView from './EquipoView'

export default function EquipoPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Equipo SIGMA'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <main className="lp-root min-h-screen overflow-x-clip font-sans">
      <Header />
      <EquipoView />
      <SiteFooter />
    </main>
  )
}
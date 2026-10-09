import { useTitle } from '@/lib/hooks'
import AudienceSection from './sections/AudienceSection'
import CtaSection from './sections/CtaSection'
import DevelopersSection from './sections/DevelopersSection'
import HeroSection from './sections/HeroSection'
import HowItWorksSection from './sections/HowItWorksSection'
import PrinciplesSection from './sections/PrinciplesSection'
import ProductSection from './sections/ProductSection'
import ShiftSection from './sections/ShiftSection'
import TechStrip from './sections/TechStrip'

export default function LandingPage() {
  useTitle('Kinsign · Payments that a scam call cannot finish')
  return (
    <main>
      <HeroSection />
      <TechStrip />
      <ShiftSection />
      <ProductSection />
      <HowItWorksSection />
      <AudienceSection />
      <PrinciplesSection />
      <DevelopersSection />
      <CtaSection />
    </main>
  )
}

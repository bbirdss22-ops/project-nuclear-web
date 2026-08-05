import { Main } from '@/components/layout/main'
import { RegistrationStats } from './components/registration-stats'

export function Dashboard() {
  return (
    <>
      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        </div>
        <RegistrationStats />
      </Main>
    </>
  )
}

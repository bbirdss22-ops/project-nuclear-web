import { useSearch } from '@tanstack/react-router'
import { AuthLayout } from '@/features/auth/auth-layout'
import { RegisterForm } from './register-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RegisterSearchParams {
  lineUserId?: string
  referrerId?: string
}

export function Register() {
  const { lineUserId, referrerId } = useSearch({ from: '/register' }) as RegisterSearchParams

  return (
    <AuthLayout>
      <Card className='max-w-md gap-4'>
        <CardHeader>
          <CardTitle className='text-xl tracking-tight'>
            สมัครสมาชิก
          </CardTitle>
          <CardDescription>
            กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิก<br />
            <span className='text-muted-foreground'>
              ฟิลด์ที่มี * จำเป็นต้องกรอก
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm
            lineUserId={lineUserId}
            referrerId={referrerId}
          />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

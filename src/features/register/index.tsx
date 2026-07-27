import { useEffect, useState } from 'react'
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
import { validateRegistrationToken } from '@/lib/api'
import { Loader2, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface RegisterSearchParams {
  lineUserId?: string
  referrerId?: string
  token?: string
}

export function Register() {
  const { lineUserId: urlLineUserId, referrerId, token } = useSearch({ from: '/register' }) as RegisterSearchParams

  const [resolvedLineUserId, setResolvedLineUserId] = useState<string | undefined>(urlLineUserId)
  const [tokenLoading, setTokenLoading] = useState(!!token)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function resolveToken() {
      try {
        const result = await validateRegistrationToken(token!)
        if (cancelled) return

        if (result.alreadyRegistered) {
          setAlreadyRegistered(true)
          setTokenError(null)
        } else {
          setResolvedLineUserId(result.lineUserId)
          setTokenError(null)
        }
      } catch (err: any) {
        if (cancelled) return
        const msg = err?.response?.data?.message || err?.message || 'ลิงก์ไม่ถูกต้องหรือหมดอายุ'
        setTokenError(msg)
      } finally {
        if (!cancelled) setTokenLoading(false)
      }
    }

    resolveToken()
    return () => { cancelled = true }
  }, [token])

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
          {tokenLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : tokenError ? (
            <Alert variant='destructive'>
              <XCircle className='h-4 w-4' />
              <AlertTitle>ลิงก์ไม่ถูกต้อง</AlertTitle>
              <AlertDescription>
                {tokenError}<br /><br />
                กรุณากด "สมัครสมาชิก" ใหม่จากเมนูใน LINE
              </AlertDescription>
            </Alert>
          ) : alreadyRegistered ? (
            <Alert>
              <AlertTitle>LINE นี้ลงทะเบียนแล้ว</AlertTitle>
              <AlertDescription>
                บัญชี LINE ของคุณได้ลงทะเบียนสมาชิกไว้แล้ว<br />
                หากมีข้อสงสัยติดต่อเจ้าหน้าที่
              </AlertDescription>
            </Alert>
          ) : (
            <RegisterForm
              lineUserId={resolvedLineUserId}
              referrerId={referrerId}
              token={token}
            />
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

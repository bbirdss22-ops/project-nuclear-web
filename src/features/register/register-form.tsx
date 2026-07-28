import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, type NavigateOptions } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createCustomer, consumeRegistrationToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const formSchema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  phone: z
    .string()
    .min(9, 'เบอร์โทรไม่ถูกต้อง')
    .max(10, 'เบอร์โทรไม่ถูกต้อง'),
  email: z.string().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  address: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface RegisterFormProps {
  lineUserId?: string
  referrerId?: string
  token?: string
}

function RegisterSuccess({
  customerCode,
  navigate,
}: {
  customerCode: string | null
  navigate: (opts: NavigateOptions) => void
}) {
  const [countdown, setCountdown] = useState(10)
  const [closeFailed, setCloseFailed] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      window.close()
      // If close fails (browser blocks it), show fallback after a short delay
      const fallbackTimer = setTimeout(() => setCloseFailed(true), 500)
      return () => clearTimeout(fallbackTimer)
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <Card className='max-w-md mx-auto'>
      <CardHeader>
        <CardTitle className='text-center text-2xl'>🎉 สมัครสมาชิกสำเร็จ!</CardTitle>
        <CardDescription className='text-center text-base'>
          {customerCode ? (
            <>
              รหัสลูกค้าของคุณคือ:
              <div className='mt-3 text-3xl font-bold tracking-wider text-primary'>
                {customerCode}
              </div>
              <div className='mt-3 text-sm text-muted-foreground'>
                📌 กรุณาจดรหัสนี้ไว้ใช้แจ้งเจ้าหน้าที่เวลาสอบถามหรือสั่งซื้อสินค้า
              </div>
            </>
          ) : (
            <>
              ขอบคุณที่สมัครสมาชิก<br />
              เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col items-center gap-4'>
        <p className='text-lg text-muted-foreground'>
          {closeFailed ? '✅ ปิดหน้านี้ได้เลย' : `⏰ ปิดหน้านี้ใน ${countdown} วินาที`}
        </p>
        <div className='flex gap-3'>
          <Button onClick={() => navigate({ to: '/' })}>กลับหน้าหลัก</Button>
          <Button
            variant='secondary'
            onClick={() => {
              window.close()
              setTimeout(() => setCloseFailed(true), 500)
            }}
          >
            ปิดเลย
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function RegisterForm({ lineUserId, referrerId, token }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [customerCode, setCustomerCode] = useState<string | null>(null)
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const customer = await createCustomer({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
        lineUserId: lineUserId || undefined,
        referrerId: referrerId || undefined,
      })

      // Consume registration token if present
      if (token && customer?.id) {
        try {
          await consumeRegistrationToken(token, customer.id)
        } catch {
          // Non-fatal: token may already be handled
          console.warn('Failed to consume registration token:', token)
        }
      }

      setCustomerCode(customer.code ?? null)
      setIsSuccess(true)
      toast.success('สมัครสมาชิกสำเร็จ! 🎉')
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return <RegisterSuccess customerCode={customerCode} navigate={navigate} />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
        <div className='grid grid-cols-2 gap-3'>
          <FormField
            control={form.control}
            name='firstName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>ชื่อ *</FormLabel>
                <FormControl>
                  <Input placeholder='สมชาย' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='lastName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>นามสกุล *</FormLabel>
                <FormControl>
                  <Input placeholder='ใจดี' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>เบอร์โทรศัพท์ *</FormLabel>
              <FormControl>
                <Input placeholder='0812345678' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>อีเมล</FormLabel>
              <FormControl>
                <Input placeholder='somchai@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='address'
          render={({ field }) => (
            <FormItem>
              <FormLabel>ที่อยู่</FormLabel>
              <FormControl>
                <Input placeholder='123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className='w-full mt-2' size='lg' disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <UserPlus />
          )}
          สมัครสมาชิก
        </Button>
      </form>
    </Form>
  )
}

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createCustomer, consumeRegistrationToken, uploadBankBook } from '@/lib/api'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z
    .string()
    .regex(/^[0-9]{9,13}$/, 'เลขบัญชีต้องเป็นตัวเลข 9-13 หลัก')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

interface RegisterFormProps {
  lineUserId?: string
  referrerId?: string
  token?: string
}

export function RegisterSuccess({
  customerCode,
}: {
  customerCode: string | null
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
    <Card className='max-w-2xl mx-auto'>
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

export function RegisterForm({ lineUserId, referrerId, token, onSuccess }: RegisterFormProps & { onSuccess?: (code: string) => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [bankBookFile, setBankBookFile] = useState<File | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
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
        bankName: data.bankName || undefined,
        bankAccountName: data.bankAccountName || undefined,
        bankAccountNumber: data.bankAccountNumber || undefined,
      })

      // Upload bank book image (optional — non-blocking)
      if (bankBookFile && customer?.id) {
        try {
          await uploadBankBook(customer.id, bankBookFile)
        } catch (bankErr: any) {
          const bankMsg =
            bankErr?.response?.data?.message ||
            'อัปโหลดรูปสมุดบัญชีไม่สำเร็จ — กรุณาอัปโหลดใหม่ภายหลังได้'
          toast.warning(bankMsg)
        }
      }

      // Consume registration token if present
      if (token && customer?.id) {
        try {
          await consumeRegistrationToken(token, customer.id)
        } catch {
          // Non-fatal: token may already be handled
          console.warn('Failed to consume registration token:', token)
        }
      }

      onSuccess?.(customer.code ?? '')
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

        <div className='mt-2 rounded-lg border bg-muted/30 p-4'>
          <h3 className='text-sm font-semibold text-foreground'>
            ข้อมูลบัญชีธนาคาร
          </h3>
          <p className='mb-3 mt-0.5 text-xs text-muted-foreground'>
            (สำหรับรับค่าคอมมิชชั่น — กรอกทีหลังได้)
          </p>
          <div className='grid gap-3'>
            <FormField
              control={form.control}
              name='bankName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ธนาคาร</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='เลือกธนาคาร' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='KBANK'>กสิกรไทย</SelectItem>
                      <SelectItem value='KTB'>กรุงไทย</SelectItem>
                      <SelectItem value='BBL'>กรุงเทพ</SelectItem>
                      <SelectItem value='SCB'>ไทยพาณิชย์</SelectItem>
                      <SelectItem value='BAY'>กรุงศรีอยุธยา</SelectItem>
                      <SelectItem value='TTB'>ทหารไทยธนชาต</SelectItem>
                      <SelectItem value='GSB'>ออมสิน</SelectItem>
                      <SelectItem value='BAAC'>ธ.ก.ส.</SelectItem>
                      <SelectItem value='OTHER'>อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bankAccountName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อบัญชี</FormLabel>
                  <FormControl>
                    <Input placeholder='สมชาย ใจดี' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bankAccountNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>เลขบัญชี</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='1234567890'
                      inputMode='numeric'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='mt-3'>
            <FormLabel>อัปโหลดรูปสมุดบัญชี (ไม่บังคับ)</FormLabel>
            <p className='mb-2 mt-0.5 text-xs text-muted-foreground'>
              ใช้ตรวจสอบบัญชีสำหรับรับค่าคอมมิชชั่น (รูป jpeg/png/webp ไม่เกิน 5MB)
            </p>
            <FormControl>
              <Input
                type='file'
                accept='image/jpeg,image/png,image/webp'
                onChange={(e) =>
                  setBankBookFile(e.target.files?.[0] ?? null)
                }
              />
            </FormControl>
            {bankBookFile && (
              <p className='mt-1 truncate text-xs text-muted-foreground'>
                📎 {bankBookFile.name}
              </p>
            )}
          </div>
        </div>

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

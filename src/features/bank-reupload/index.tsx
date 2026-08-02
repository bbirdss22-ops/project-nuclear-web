import { useEffect, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { AuthLayout } from '@/features/auth/auth-layout'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { validateReuploadToken, reuploadBankBook } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface BankReuploadSearch {
  token?: string
}

type Status = 'loading' | 'invalid' | 'rejected' | 'success' | 'other'

interface ValidatedCustomer {
  id: string
  bankName?: string | null
  bankAccountName?: string | null
  bankRejectReason?: string | null
  bankStatus?: string
}

export function BankReupload() {
  const { token } = useSearch({ from: '/bank-reupload' }) as BankReuploadSearch

  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [customer, setCustomer] = useState<ValidatedCustomer | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!token) {
      setErrorMsg('ไม่พบ token ในการอัปโหลด — กรุณากดลิงก์จาก LINE ใหม่')
      setStatus('invalid')
      return
    }

    let cancelled = false

    async function validate() {
      try {
        const result = await validateReuploadToken(token!)
        if (cancelled) return
        if (result.valid && result.customer) {
          setCustomer(result.customer)
          setStatus(result.customer.bankStatus === 'rejected' ? 'rejected' : 'other')
        } else {
          setErrorMsg(result.message || 'token ไม่ถูกต้องหรือหมดอายุ')
          setStatus('invalid')
        }
      } catch (err: any) {
        if (cancelled) return
        setErrorMsg(err?.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        setStatus('invalid')
      }
    }

    validate()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleUpload() {
    if (!file || !token) {
      toast.error('กรุณาเลือกรูปสมุดบัญชีก่อน')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์ต้องมีขนาดไม่เกิน 5MB')
      return
    }

    setUploading(true)
    try {
      await reuploadBankBook(token, file)
      setStatus('success')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  function renderBody() {
    if (status === 'loading') {
      return (
        <div className='flex items-center justify-center p-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      )
    }

    if (status === 'invalid') {
      return (
        <Alert variant='destructive'>
          <AlertTitle>ลิงก์ไม่ถูกต้องหรือหมดอายุ</AlertTitle>
          <AlertDescription>
            {errorMsg}
            <br />
            <br />
            กรุณากดลิงก์ใหม่จากข้อความใน LINE หรือติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือ
          </AlertDescription>
        </Alert>
      )
    }

    if (status === 'success') {
      return (
        <Alert>
          <AlertTitle className='text-green-600'>✅ อัปโหลดสำเร็จ</AlertTitle>
          <AlertDescription>
            ส่งข้อมูลบัญชีธนาคารใหม่แล้ว<br />
            เจ้าหน้าที่จะตรวจสอบและแจ้งผลผ่าน LINE เร็วๆ นี้
          </AlertDescription>
        </Alert>
      )
    }

    if (status === 'other') {
      return (
        <Alert>
          <AlertTitle>สถานะบัญชีธนาคาร</AlertTitle>
          <AlertDescription>
            ข้อมูลบัญชีธนาคารของคุณไม่จำเป็นต้องอัปโหลดใหม่ ณ ตอนนี้
            (สถานะ: {customer?.bankStatus ?? '—'})
          </AlertDescription>
        </Alert>
      )
    }

    // rejected — show upload form
    return (
      <div className='grid gap-4'>
        <div className='rounded-lg border bg-muted/30 p-4'>
          <h3 className='font-semibold'>ข้อมูลบัญชีธนาคาร</h3>
          <dl className='mt-2 grid gap-1 text-sm'>
            <div className='flex justify-between'>
              <dt className='text-muted-foreground'>ธนาคาร</dt>
              <dd>{customer?.bankName ?? '—'}</dd>
            </div>
            <div className='flex justify-between'>
              <dt className='text-muted-foreground'>ชื่อบัญชี</dt>
              <dd>{customer?.bankAccountName ?? '—'}</dd>
            </div>
          </dl>
          <Alert variant='destructive' className='mt-3'>
            <AlertTitle>เหตุผลที่ไม่ผ่าน</AlertTitle>
            <AlertDescription>{customer?.bankRejectReason ?? '—'}</AlertDescription>
          </Alert>
        </div>

        <div className='grid gap-3'>
          <div>
            <label className='mb-2 block text-sm font-medium'>
              อัปโหลดรูปสมุดบัญชีใหม่
            </label>
            <Input
              type='file'
              accept='image/jpeg,image/png,image/webp'
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className='mt-1 truncate text-xs text-muted-foreground'>
                📎 {file.name}
              </p>
            )}
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className='animate-spin' /> : <Upload />}
            ส่งข้อมูลใหม่
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AuthLayout>
      <Card className='max-w-md gap-4'>
        <CardHeader>
          <CardTitle className='text-xl tracking-tight'>
            อัปโหลดรูปสมุดบัญชีใหม่
          </CardTitle>
          <CardDescription>
            แก้ไขข้อมูลบัญชีธนาคาร สำหรับรับค่าคอมมิชชั่น
          </CardDescription>
        </CardHeader>
        <CardContent>{renderBody()}</CardContent>
      </Card>
    </AuthLayout>
  )
}

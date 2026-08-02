import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getCustomerById,
  getBankBookUrl,
  reviewCustomerBank,
  type Customer,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Main } from '@/components/layout/main'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface CustomerDetailProps {
  customerId: string
}

function BankStatusBadge({ status }: { status?: Customer['bankStatus'] }) {
  switch (status) {
    case 'pending':
      return <Badge variant='outline'>🟡 รอตรวจสอบ</Badge>
    case 'approved':
      return <Badge variant='default'>🟢 ผ่าน</Badge>
    case 'rejected':
      return <Badge variant='destructive'>🔴 ไม่ผ่าน</Badge>
    default:
      return <Badge variant='secondary'>—</Badge>
  }
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [bookUrl, setBookUrl] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomerById(customerId),
  })

  // Fetch signed URL when customer has a bank book image
  useQuery({
    queryKey: ['bank-book-url', customerId],
    enabled: !!customer?.bankBookPath && !bookUrl,
    queryFn: async () => {
      const { url } = await getBankBookUrl(customerId)
      setBookUrl(url)
      return url
    },
  })

  const handleBack = useCallback(() => {
    navigate({ to: '/customers' })
  }, [navigate])

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customer', customerId] })
  }, [queryClient, customerId])

  async function doApprove() {
    setReviewing(true)
    try {
      const result = await reviewCustomerBank(customerId, 'approve')
      toast.success('อนุมัติบัญชีธนาคารแล้ว')
      if (!result.linePushSent) {
        toast.warning('แจ้งเตือน LINE ไม่สำเร็จ (ผู้ใช้ยังไม่ได้แอด LINE)')
      }
      setConfirmApprove(false)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'อนุมัติไม่สำเร็จ')
    } finally {
      setReviewing(false)
    }
  }

  async function doReject() {
    if (!rejectReason.trim()) {
      toast.error('กรุณาระบุเหตุผล')
      return
    }
    setReviewing(true)
    try {
      const result = await reviewCustomerBank(customerId, 'reject', rejectReason.trim())
      toast.success('ไม่อนุมัติบัญชีธนาคารแล้ว')
      if (!result.linePushSent) {
        toast.warning('แจ้งเตือน LINE ไม่สำเร็จ (ผู้ใช้ยังไม่ได้แอด LINE)')
      }
      setRejectOpen(false)
      setRejectReason('')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ไม่อนุมัติไม่สำเร็จ')
    } finally {
      setReviewing(false)
    }
  }

  if (error) {
    toast.error('Failed to load customer details.')
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className='flex flex-col items-center gap-4 p-12'>
        <p className='text-muted-foreground'>Customer not found.</p>
        <Button onClick={handleBack}>Back to Customers</Button>
      </div>
    )
  }

  const detailRows = [
    { label: 'First Name', value: customer.firstName },
    { label: 'Last Name', value: customer.lastName },
    { label: 'Phone', value: customer.phone },
    { label: 'Email', value: customer.email ?? '—' },
    { label: 'Address', value: customer.address ?? '—' },
    { label: 'Line User ID', value: customer.lineUserId ?? '—' },
    {
      label: 'Status',
      value: (
        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
          {customer.status}
        </Badge>
      ),
    },
    {
      label: 'Created At',
      value: new Date(customer.createdAt).toLocaleString('en-US'),
    },
    {
      label: 'Updated At',
      value: new Date(customer.updatedAt).toLocaleString('en-US'),
    },
  ]

  return (
    <Main>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='outline' onClick={handleBack}>
          &larr; Back
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>
          {customer.firstName} {customer.lastName}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {detailRows.map((row) => (
              <div key={row.label} className='space-y-1'>
                <dt className='text-sm font-medium text-muted-foreground'>
                  {row.label}
                </dt>
                <dd className='text-sm'>
                  {row.value ?? <Skeleton className='h-4 w-32' />}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Bank Account Section */}
      <Card className='mt-6'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle>บัญชีธนาคาร</CardTitle>
          <BankStatusBadge status={customer.bankStatus} />
        </CardHeader>
        <CardContent className='grid gap-4'>
          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='space-y-1'>
              <dt className='text-sm font-medium text-muted-foreground'>
                ธนาคาร
              </dt>
              <dd className='text-sm'>{customer.bankName ?? '—'}</dd>
            </div>
            <div className='space-y-1'>
              <dt className='text-sm font-medium text-muted-foreground'>
                ชื่อบัญชี
              </dt>
              <dd className='text-sm'>{customer.bankAccountName ?? '—'}</dd>
            </div>
            <div className='space-y-1'>
              <dt className='text-sm font-medium text-muted-foreground'>
                เลขบัญชี
              </dt>
              <dd className='text-sm'>{customer.bankAccountNumber ?? '—'}</dd>
            </div>
          </dl>

          <div className='space-y-2'>
            <dt className='text-sm font-medium text-muted-foreground'>
              รูปสมุดบัญชี
            </dt>
            {customer.bankBookPath ? (
              bookUrl ? (
                <img
                  src={bookUrl}
                  alt='Bank book'
                  className='h-48 w-full max-w-xs rounded-lg border object-cover'
                />
              ) : (
                <Skeleton className='h-48 w-full max-w-xs rounded-lg' />
              )
            ) : (
              <p className='text-sm text-muted-foreground'>ไม่มีรูป</p>
            )}
          </div>

          {customer.bankStatus === 'rejected' && (
            <Alert className='border-destructive text-destructive'>
              <AlertTitle className='font-semibold'>
                🔴 ไม่ผ่านการตรวจสอบ
              </AlertTitle>
              <AlertDescription>
                <span className='whitespace-pre-line'>
                  {customer.bankRejectReason ?? '—'}
                </span>
                <br />
                ลูกค้าสามารถอัปโหลดรูปสมุดบัญชีใหม่ผ่านลิงก์ที่ส่งไปใน LINE
              </AlertDescription>
            </Alert>
          )}

          {customer.bankStatus === 'pending' && (
            <div className='flex gap-3'>
              <Button
                variant='default'
                onClick={() => setConfirmApprove(true)}
                disabled={reviewing}
              >
                ✅ อนุมัติ
              </Button>
              <Button
                variant='destructive'
                onClick={() => setRejectOpen(true)}
                disabled={reviewing}
              >
                ❌ ไม่อนุมัติ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ไม่อนุมัติบัญชีธนาคาร</DialogTitle>
            <DialogDescription>
              กรุณาระบุเหตุผล — ระบบจะแจ้งให้ลูกค้าทราบผ่าน LINE พร้อมลิงก์อัปโหลดใหม่
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder='ระบุเหตุผลที่ไม่อนุมัติ'
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setRejectOpen(false)}
              disabled={reviewing}
            >
              ยกเลิก
            </Button>
            <Button
              variant='destructive'
              onClick={doReject}
              disabled={reviewing || !rejectReason.trim()}
            >
              {reviewing ? <Loader2 className='animate-spin' /> : null}
              ยืนยันไม่อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve confirm dialog */}
      <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
            <DialogDescription>
              อนุมัติบัญชีธนาคารของ {customer.firstName} {customer.lastName}{' '}
              หรือไม่? ระบบจะแจ้งผลผ่าน LINE
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setConfirmApprove(false)}
              disabled={reviewing}
            >
              ยกเลิก
            </Button>
            <Button onClick={doApprove} disabled={reviewing}>
              {reviewing ? <Loader2 className='animate-spin' /> : null}
              ✅ อนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Main>
  )
}

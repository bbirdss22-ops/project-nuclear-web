import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getCustomerById } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { Skeleton } from '@/components/ui/skeleton'

interface CustomerDetailProps {
  customerId: string
}

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const navigate = useNavigate()

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => getCustomerById(customerId),
  })

  const handleBack = useCallback(() => {
    navigate({ to: '/customers' })
  }, [navigate])

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
    { label: 'ธนาคาร', value: customer.bankName ?? '—' },
    { label: 'ชื่อบัญชี', value: customer.bankAccountName ?? '—' },
    { label: 'เลขบัญชี', value: customer.bankAccountNumber ?? '—' },
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
    </Main>
  )
}

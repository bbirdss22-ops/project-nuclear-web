import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCustomer, type Customer } from '@/lib/api'

interface EditCustomerDialogProps {
  customer: Customer | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function EditCustomerDialog({
  customer,
  onOpenChange,
  onSaved,
}: EditCustomerDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName ?? '')
      setLastName(customer.lastName ?? '')
      setPhone(customer.phone ?? '')
      setEmail(customer.email ?? '')
      setAddress(customer.address ?? '')
      setBankName(customer.bankName ?? '')
      setBankAccountName(customer.bankAccountName ?? '')
      setBankAccountNumber(customer.bankAccountNumber ?? '')
    }
  }, [customer])

  const handleSave = async () => {
    if (!customer) return
    setSaving(true)
    try {
      await updateCustomer(customer.id, {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        address: address || undefined,
        bankName: bankName || undefined,
        bankAccountName: bankAccountName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
      })
      toast.success('อัปเดตข้อมูลลูกค้าแล้ว')
      setSaving(false)
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setSaving(false)
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'อัปเดตไม่สำเร็จ')
    }
  }

  return (
    <Dialog open={!!customer} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลส่วนตัวและบัญชีธนาคารของลูกค้า
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='firstName'>ชื่อจริง</Label>
              <Input
                id='firstName'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='lastName'>นามสกุล</Label>
              <Input
                id='lastName'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='phone'>เบอร์โทรศัพท์</Label>
            <Input
              id='phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='email'>อีเมล</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='address'>ที่อยู่</Label>
            <Input
              id='address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='bankName'>ธนาคาร</Label>
              <Input
                id='bankName'
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder='เช่น KBANK'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='bankAccountNumber'>เลขบัญชี</Label>
              <Input
                id='bankAccountNumber'
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder='9-13 หลัก'
              />
            </div>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='bankAccountName'>ชื่อบัญชี</Label>
            <Input
              id='bankAccountName'
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

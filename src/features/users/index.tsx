import { useMemo, useState } from 'react'
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Loader2, Pencil, Plus, SearchIcon, Trash2, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type AdminUser,
} from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useDebounce } from '@/hooks/use-debounce'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UserFormState {
  username: string
  password: string
  role: 'admin' | 'superadmin'
}

const emptyForm: UserFormState = {
  username: '',
  password: '',
  role: 'admin',
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'superadmin') {
    return <Badge variant='destructive'>superadmin</Badge>
  }
  return <Badge variant='secondary'>admin</Badge>
}

export function Users() {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<UserFormState>(emptyForm)

  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<UserFormState>(emptyForm)

  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, pageSize, debouncedSearch],
    queryFn: () =>
      getUsers(page, pageSize, debouncedSearch.trim() || undefined),
  })

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const users = useMemo(() => data?.data ?? [], [data])
  const totalItems = data?.totalItems ?? 0
  const totalPages = data?.totalPages ?? 0

  async function handleAdd() {
    if (!addForm.username.trim()) {
      toast.error('กรุณาระบุชื่อผู้ใช้')
      return
    }
    if (addForm.password.length < 8) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    setSubmitting(true)
    try {
      await createUser({
        username: addForm.username.trim(),
        password: addForm.password,
        role: addForm.role,
      })
      toast.success('สร้างผู้ใช้สำเร็จ')
      setAddOpen(false)
      setAddForm(emptyForm)
      refetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'สร้างผู้ใช้ไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(user: AdminUser) {
    setEditUser(user)
    setEditForm({
      username: user.username,
      password: '',
      role: user.role === 'superadmin' ? 'superadmin' : 'admin',
    })
  }

  async function handleUpdate() {
    if (!editUser) return
    if (!editForm.username.trim()) {
      toast.error('กรุณาระบุชื่อผู้ใช้')
      return
    }
    if (editForm.password && editForm.password.length < 8) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    setSubmitting(true)
    try {
      await updateUser(editUser.id, {
        username: editForm.username.trim(),
        role: editForm.role,
        ...(editForm.password.trim() ? { password: editForm.password } : {}),
      })
      toast.success('อัปเดตผู้ใช้สำเร็จ')
      setEditUser(null)
      refetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'อัปเดตผู้ใช้ไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteUserTarget) return
    setDeleting(true)
    try {
      await deleteUser(deleteUserTarget.id)
      toast.success(`ลบผู้ใช้ ${deleteUserTarget.username} สำเร็จ`)
      setDeleteUserTarget(null)
      refetchUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ลบผู้ใช้ไม่สำเร็จ')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Main>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <UserCog className='h-7 w-7 text-primary' />
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>User List</h1>
            <p className='text-sm text-muted-foreground'>
              Manage admin users and their roles.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className='mb-4 flex flex-wrap items-center gap-2'>
        <div className='relative w-full max-w-sm'>
          <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search users...'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className='pl-10'
          />
        </div>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className='h-32 text-center'>
                  <Loader2 className='mx-auto h-6 w-6 animate-spin text-muted-foreground' />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='h-32 text-center text-muted-foreground'>
                  {error
                    ? 'Failed to load users. Please try again.'
                    : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.username}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {new Date(user.createdAt).toLocaleString('th-TH')}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => openEdit(user)}
                        title='Edit'
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setDeleteUserTarget(user)}
                        disabled={user.id === currentUserId}
                        title={
                          user.id === currentUserId
                            ? 'ไม่สามารถลบบัญชีตัวเองได้'
                            : 'Delete'
                        }
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className='mt-4 flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            Showing{' '}
            {totalItems > 0 ? (page - 1) * pageSize + 1 : 0}-
            {Math.min(page * pageSize, totalItems)} of {totalItems} users
          </p>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <p className='text-sm text-muted-foreground'>Rows per page</p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className='h-8 w-16'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className='px-2 text-sm text-muted-foreground'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new admin user.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='add-username'>Username</Label>
              <Input
                id='add-username'
                placeholder='admin1'
                value={addForm.username}
                onChange={(e) =>
                  setAddForm({ ...addForm, username: e.target.value })
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='add-password'>Password</Label>
              <Input
                id='add-password'
                type='password'
                placeholder='อย่างน้อย 8 ตัวอักษร'
                value={addForm.password}
                onChange={(e) =>
                  setAddForm({ ...addForm, password: e.target.value })
                }
              />
            </div>
            <div className='grid gap-2'>
              <Label>Role</Label>
              <Select
                value={addForm.role}
                onValueChange={(v: 'admin' | 'superadmin') =>
                  setAddForm({ ...addForm, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='admin'>admin</SelectItem>
                  <SelectItem value='superadmin'>superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAddOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(o) => !o && setEditUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update username, role, or reset password.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='edit-username'>Username</Label>
                <Input
                  id='edit-username'
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v: 'admin' | 'superadmin') =>
                    setEditForm({ ...editForm, role: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='admin'>admin</SelectItem>
                    <SelectItem value='superadmin'>superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='edit-password'>
                  New Password{' '}
                  <span className='font-normal text-muted-foreground'>
                    (เว้นว่างเพื่อไม่เปลี่ยน)
                  </span>
                </Label>
                <Input
                  id='edit-password'
                  type='password'
                  placeholder='reset password'
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditUser(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteUserTarget}
        onOpenChange={(o) => !o && setDeleteUserTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              ยืนยันการลบผู้ใช้{' '}
              <span className='font-semibold'>{deleteUserTarget?.username}</span>
              ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className='bg-destructive text-white hover:bg-destructive/90'
            >
              {deleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  )
}

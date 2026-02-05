"use client"
import { PrimaryTooltip } from '@/components/common/PrimaryTooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { useUsers } from '@/hooks/useUsers'
import { TypeAssign } from '@/types/firebase'
import { Eye, RotateCcw, Trash2 } from 'lucide-react'
import React from 'react'
import { toast } from 'react-toastify'
import { Button } from '../ui/button'

const TrashTable = () => {
    const { deletedUsers, deleteUserPermanently, updateUserByDocId } = useUsers()
    const [open, setOpen] = React.useState(false)
    const [selected, setSelected] = React.useState<{ id: string; name?: string; phone?: string; email?: string; source?: string; status?: string; note?: string; label?: string[]; assign?: TypeAssign } | null>(null)
    const [confirmOpen, setConfirmOpen] = React.useState(false)
    const [confirmAction, setConfirmAction] = React.useState<{ type: 'restore' | 'delete'; docId: string; name: string } | null>(null)
    return (
        <>
            <div className='overflow-hidden rounded-xl border border-gray-400 bg-white dark:border-white/5 dark:bg-white/3'>
                <div className='p-5'>
                    <Table>
                        <TableHeader className='border-b border-gray-400 dark:border-white/5'>
                            <TableRow>
                                <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Tên</TableCell>
                                <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Số Điện Thoại</TableCell>
                                <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Nguồn</TableCell>
                                <TableCell isHeader className='px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400'>Tùy chọn</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className='divide-y divide-gray-400 dark:divide-white/5'>
                            {deletedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className='py-20 text-center text-gray-500 dark:text-gray-400 font-bold text-2xl'>(TRỐNG...)</TableCell>
                                </TableRow>
                            ) : (
                                deletedUsers.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>{u.name}</TableCell>
                                        <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>{u.phone}</TableCell>
                                        <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>{u.source}</TableCell>
                                        <TableCell className='px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400'>
                                            <div className='flex gap-2'>
                                                <PrimaryTooltip content='Xem chi tiết'>
                                                    <Button variant='outline' size='sm' onClick={() => { setSelected(u); setOpen(true) }}>
                                                        <Eye className='size-4' />
                                                    </Button>
                                                </PrimaryTooltip>
                                                <PrimaryTooltip content='Khôi phục'>
                                                    <Button variant='outline' size='sm' onClick={() => { setConfirmAction({ type: 'restore', docId: u.id, name: u.name || '' }); setConfirmOpen(true); }}>
                                                        <RotateCcw className='size-4' />
                                                    </Button>
                                                </PrimaryTooltip>
                                                <PrimaryTooltip content='Xóa vĩnh viễn'>
                                                    <Button variant='outline' size='sm' onClick={() => { setConfirmAction({ type: 'delete', docId: u.id, name: u.name || '' }); setConfirmOpen(true); }}>
                                                        <Trash2 className='size-4' />
                                                    </Button>
                                                </PrimaryTooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chi tiết liên hệ</DialogTitle>
                        <DialogDescription>Xem thông tin trước khi xóa vĩnh viễn.</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className='space-y-3 text-sm max-h-96 overflow-y-auto'>
                            <div className='flex items-center justify-between'>
                                <span className='text-gray-500 dark:text-gray-400'>Tên</span>
                                <span className='font-medium'>{selected.name}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-gray-500 dark:text-gray-400'>Số điện thoại</span>
                                <span className='font-medium'>{selected.phone}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-gray-500 dark:text-gray-400'>Email</span>
                                <span className='font-medium'>{selected.email || 'N/A'}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-gray-500 dark:text-gray-400'>Nguồn</span>
                                <span className='font-medium'>{selected.source}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-gray-500 dark:text-gray-400'>Trạng thái</span>
                                <span className='font-medium'>{selected.status || 'N/A'}</span>
                            </div>
                            {selected.note && (
                                <div className='flex items-start justify-between gap-4'>
                                    <span className='text-gray-500 dark:text-gray-400'>Ghi chú</span>
                                    <span className='font-medium text-right max-w-xs'>{selected.note}</span>
                                </div>
                            )}
                            {Array.isArray(selected.label) && selected.label.length > 0 && (
                                <div className='flex items-start justify-between gap-4'>
                                    <span className='text-gray-500 dark:text-gray-400'>Nhãn</span>
                                    <div className='flex flex-wrap gap-1'>
                                        {selected.label.map((l: string, idx: number) => (
                                            <span key={idx} className='px-2 py-1 rounded-xs bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'>
                                                {l}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {Array.isArray(selected.assign) && selected.assign.length > 0 && (
                                <div className='flex items-start justify-between gap-4'>
                                    <span className='text-gray-500 dark:text-gray-400'>Gán cho</span>
                                    <div className='flex flex-col gap-1'>
                                        {selected.assign.map((a: TypeAssign[number], idx: number) => (
                                            <span key={idx} className='text-right font-medium'>
                                                {a.employeeName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className='mt-4 flex justify-end gap-2'>
                        {selected && (
                            <>
                                <PrimaryTooltip content='Khôi phục liên hệ'>
                                    <Button variant='outline' size='sm' onClick={() => { setConfirmAction({ type: 'restore', docId: selected.id, name: selected.name || '' }); setConfirmOpen(true); }}>
                                        <RotateCcw className='size-4' />
                                    </Button>
                                </PrimaryTooltip>
                                <PrimaryTooltip content='Xóa vĩnh viễn'>
                                    <Button variant='outline' size='sm' onClick={() => { setConfirmAction({ type: 'delete', docId: selected.id, name: selected.name || '' }); setConfirmOpen(true); }}>
                                        <Trash2 className='size-4' />
                                    </Button>
                                </PrimaryTooltip>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction?.type === 'restore' ? 'Khôi phục liên hệ?' : 'Xóa vĩnh viễn?'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction?.type === 'restore'
                                ? `Bạn có chắc chắn muốn khôi phục liên hệ "${confirmAction?.name}"?`
                                : `Bạn có chắc chắn muốn xóa vĩnh viễn liên hệ "${confirmAction?.name}"? Hành động này không thể hoàn tác.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='flex justify-end gap-2'>
                        <Button variant='outline' size='sm' onClick={() => setConfirmOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant='primary'
                            size='sm'
                            onClick={async () => {
                                try {
                                    if (confirmAction?.type === 'restore') {
                                        updateUserByDocId({
                                            docId: confirmAction.docId, data: { isDelete: false },
                                            action: {
                                                note: 'Khôi phục liên hệ từ thùng rác',
                                                action: "restore_contact"
                                            }
                                        })
                                        toast.success('Thành Công')
                                    } else if (confirmAction?.type === 'delete') {
                                        // deleteUserPermanently(confirmAction.docId)
                                        toast.success('Thành Công')
                                    }
                                } catch {
                                    toast.error('Lỗi, Vui Lòng Liên Hệ Dev !!')
                                } finally {
                                    setConfirmOpen(false)
                                    setOpen(false)
                                }
                            }}
                        >
                            {confirmAction?.type === 'restore' ? 'Khôi phục' : 'Xóa vĩnh viễn'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default TrashTable

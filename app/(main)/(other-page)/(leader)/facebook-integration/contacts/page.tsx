'use client'
import ComponentCard from '@/components/common/ComponentCard'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import { PrimaryTooltip } from '@/components/common/PrimaryTooltip'
import AddContactFromCandidate from '@/components/dialog/AddContactFromCandidate'
import Checkbox from '@/components/form/input/Checkbox'
import { Button } from '@/components/ui/button'
import PushFloatingUserFromCandidate from '@/components/ui/button/PushFloatingUserFromCandidate'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { deleteContactCandidateAsync, fetchContactCandidatesAsync, selectContacts, selectContactsStatus } from '@/lib/redux/features/contacts/contactsSlice'
import type { ChatContact } from '@/lib/redux/features/contacts/contactsSlice'
import { fetchPagesAsync, selectPages } from '@/lib/redux/features/messages/messagesSlice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { memo, useEffect, useMemo, useState, useDeferredValue } from 'react'
import { useController, useForm, useWatch, type Control } from 'react-hook-form'
import { FaCopy, FaEraser, FaPlus, FaRotateRight, FaTrash } from 'react-icons/fa6'
import { IoPush } from 'react-icons/io5'
import { toast } from 'react-toastify'

type FormValues = { selected: Record<string, boolean> }
const EMPTY_SELECTED: Record<string, boolean> = Object.freeze({} as Record<string, boolean>)
export default function ChatContactsPage() {
    const dispatch = useAppDispatch()
    const contacts = useAppSelector(selectContacts)
    const status = useAppSelector(selectContactsStatus)
    const pages = useAppSelector(selectPages)
    const [pageNameCache, setPageNameCache] = useState<Record<string, string>>({})
    const [search, setSearch] = useState('')
    const [rescanning, setRescanning] = useState(false)
    const [rescanMessage, setRescanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; contactId: string; phone: string }>({ isOpen: false, contactId: '', phone: '' })
    const [isDeleting, setIsDeleting] = useState(false)

    const form = useForm<FormValues>({ defaultValues: { selected: {} } })

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchContactCandidatesAsync())
        }
    }, [dispatch, status])

    // Ensure page list is loaded so page names render
    useEffect(() => {
        if (!pages || pages.length === 0) {
            dispatch(fetchPagesAsync({ apiBaseUrl: '' }))
        }
    }, [dispatch, pages])

    // Map pageId to page name
    // Merge fetched page names into a stable cache to avoid flicker when API returns empty
    useEffect(() => {
        if (pages && pages.length > 0) {
            setPageNameCache(prev => {
                const next = { ...prev }
                pages.forEach(p => {
                    if (p.pageId) next[p.pageId] = p.name || p.pageId
                })
                return next
            })
        }
    }, [pages])

    const handleRescan = async () => {
        setRescanning(true)
        setRescanMessage(null)
        try {
            const res = await fetch('/api/contacts/rescan', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                setRescanMessage({ type: 'success', text: data.message })
                // Refresh contacts list
                dispatch(fetchContactCandidatesAsync())
            } else {
                setRescanMessage({ type: 'error', text: data.error || 'Rescan failed' })
            }
        } catch {
            setRescanMessage({ type: 'error', text: 'Network error during rescan' })
        } finally {
            setRescanning(false)
        }
    }

    const deferredSearch = useDeferredValue(search)
    const filtered = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase()
        if (!q) return contacts
        return contacts.filter((c) => {
            const pageName = pageNameCache[c.pageId] || c.pageName || c.pageId
            const customerName = c.customerName || c.name || c.psid || ""
            const fields = [
                c.phone,
                customerName,
                pageName,
                c.conversationId,
                c.messageSnippet,
            ]
            return fields.some((v) => (v ? String(v).toLowerCase() : '').includes(q))
        })
    }, [contacts, deferredSearch, pageNameCache])

    const formatTime = (iso: string) => {
        try {
            return new Date(iso).toLocaleString()
        } catch {
            return iso
        }
    }

    const handleDeleteContact = (contactId: string, phone: string) => {
        setDeleteDialog({ isOpen: true, contactId, phone })
    }

    const confirmDelete = async () => {
        setIsDeleting(true)
        try {
            await dispatch(deleteContactCandidateAsync(deleteDialog.contactId))
            toast.success('Xóa liên hệ thành công')
            setDeleteDialog({ isOpen: false, contactId: '', phone: '' })
        } catch (error) {
            console.error(error)
            toast.error('Lỗi xóa liên hệ')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Danh Sách Liên Hệ Từ Các Cuộc Trò Chuyện" />

            <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, contactId: '', phone: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa liên hệ</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa liên hệ <span className="font-semibold text-gray-800 dark:text-white">{deleteDialog.phone}</span>? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ isOpen: false, contactId: '', phone: '' })}
                            disabled={isDeleting}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ComponentCard
                title="Danh sách liên hệ đã phát hiện"
                desc="Các số điện thoại được tìm thấy trong tin nhắn, sắp xếp theo thời gian gần nhất."
            >
                {/* Rescan message */}
                {rescanMessage && (
                    <div className={`rounded-lg border p-4 text-sm ${rescanMessage.type === 'success'
                        ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200'
                        : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                        }`}>
                        {rescanMessage.text}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo số điện thoại, tên page, đoạn hội thoại..."
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-gray-500"
                    />
                    <div className="flex items-center gap-2">
                        <PrimaryTooltip content="Xóa tìm kiếm">
                            <Button
                                variant="outline"
                                onClick={() => setSearch('')}
                                disabled={!search}
                                aria-label="Xóa tìm kiếm"
                            >
                                <FaEraser />
                            </Button>
                        </PrimaryTooltip>
                        <PrimaryTooltip content="Quét lại liên hệ">
                            <Button
                                onClick={handleRescan}
                                disabled={rescanning}
                                aria-label="Quét lại liên hệ"
                            >
                                {rescanning ? '...' : <FaRotateRight />}
                            </Button>
                        </PrimaryTooltip>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                                <TableRow>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <SelectAllHeader control={form.control} setValue={form.setValue} ids={filtered.map((c) => c.id)} />
                                    </TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">Số điện thoại</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">Khách hàng</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">Page</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">Lần thấy gần nhất</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">Trích đoạn</TableCell>
                                    <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-600 dark:text-gray-300">Thao tác</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {status === 'loading' ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Đang tải liên hệ...
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            Không có dữ liệu tương ứng.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((c) => {
                                        const pageName = pageNameCache[c.pageId] || c.pageName || c.pageId
                                        return (
                                            <ContactRow
                                                key={c.id}
                                                contact={c}
                                                pageName={pageName}
                                                control={form.control}
                                                onDelete={handleDeleteContact}
                                                formatTime={formatTime}
                                            />
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </ComponentCard>
            <BulkActionsBar control={form.control} />
        </div>
    )
}

type ContactRowProps = {
    contact: ChatContact
    pageName: string
    control: Control<FormValues>
    onDelete: (contactId: string, phone: string) => void
    formatTime: (iso: string) => string
}

const ContactRow = memo(function ContactRow({ contact: c, pageName, control, onDelete, formatTime }: ContactRowProps) {
    const { field } = useController({
        name: `selected.${c.id}`,
        control,
        defaultValue: false,
    })
    return (
        <TableRow>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                <Checkbox checked={!!field.value} onChange={field.onChange} />
            </TableCell>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-800 dark:text-white/90">{c.phone}</span>
            </TableCell>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                <span className="block font-medium text-gray-800 dark:text-white/90">{c.customerName || c.name || c.psid}</span>
            </TableCell>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                <span className="block">{pageName}</span>
            </TableCell>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                {formatTime(c.lastSeenAt)}
            </TableCell>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                <span className="block truncate max-w-64">{c.messageSnippet}</span>
            </TableCell>
            <TableCell className="px-5 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                    <PrimaryTooltip content="Đẩy vào dữ liệu thả nổi">
                        <div>
                            <PushFloatingUserFromCandidate
                                initialPhone={c.phone}
                                initialCustomerName={c.customerName || c.name || c.psid || ""}
                                initialSource="Cào Mess"
                            />
                        </div>
                    </PrimaryTooltip>
                    <PrimaryTooltip content="Thêm khách hàng">
                        <AddContactFromCandidate
                            phone={c.phone}
                            customerName={c.customerName || c.name || c.psid}
                            buttonContent={
                                <Button
                                    size="sm"
                                    variant="outline"
                                >
                                    <FaPlus />
                                </Button>
                            }
                        />
                    </PrimaryTooltip>
                    <PrimaryTooltip content="Sao chép số">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(c.phone)}
                            aria-label="Sao chép số"
                        >
                            <FaCopy />
                        </Button>
                    </PrimaryTooltip>
                    <PrimaryTooltip content="Xóa liên hệ">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(c.id, c.phone)}
                            aria-label="Xóa liên hệ"
                        >
                            <FaTrash className="text-red-500" />
                        </Button>
                    </PrimaryTooltip>
                </div>
            </TableCell>
        </TableRow>
    )
})

type BulkActionsBarProps = { control: Control<FormValues> }
const BulkActionsBar = memo(function BulkActionsBar({ control }: BulkActionsBarProps) {
    const selectedRaw = useWatch({ control, name: 'selected' }) as Record<string, boolean> | undefined
    const selected = selectedRaw ?? EMPTY_SELECTED
    const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected])
    if (selectedIds.length === 0) return null
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
                <span className="text-sm text-gray-600 dark:text-gray-300">{selectedIds.length} đã chọn</span>
                <PrimaryTooltip content="Thêm khách hàng">
                    <Button size="sm" variant="outline" aria-label="Thêm khách hàng"><IoPush /></Button>
                </PrimaryTooltip>
                <PrimaryTooltip content="Thêm khách hàng">
                    <Button size="sm" variant="outline" aria-label="Thêm khách hàng"><FaPlus /></Button>
                </PrimaryTooltip>
                <PrimaryTooltip content="Sao chép số">
                    <Button size="sm" variant="outline" aria-label="Sao chép số"><FaCopy /></Button>
                </PrimaryTooltip>
                <PrimaryTooltip content="Xóa liên hệ">
                    <Button size="sm" variant="destructive" aria-label="Xóa liên hệ"><FaTrash /></Button>
                </PrimaryTooltip>
            </div>
        </div>
    )
})

import type { UseFormSetValue } from 'react-hook-form'

type SelectAllHeaderProps = { control: Control<FormValues>; setValue: UseFormSetValue<FormValues>; ids: string[] }
const SelectAllHeader = memo(function SelectAllHeader({ control, setValue, ids }: SelectAllHeaderProps) {
    const selectedRaw = useWatch({ control, name: 'selected' }) as Record<string, boolean> | undefined
    const selected = selectedRaw ?? EMPTY_SELECTED
    const allSelected = ids.length > 0 && ids.every((id) => selected[id])
    const onToggleAll = (checked: boolean) => {
        ids.forEach((id) => setValue(`selected.${id}`, checked))
    }
    return (
        <div className="flex items-center gap-2">
            <Checkbox checked={allSelected} onChange={onToggleAll} />
        </div>
    )
})

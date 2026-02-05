"use client"
import { useAdmin } from '@/hooks/useAdmin'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUsers } from '@/hooks/useUsers'
import { TypeAssign, TypeUser } from '@/types/firebase'
import { orderBy } from '@/utils/shared/array'
import React, { memo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CgExport } from 'react-icons/cg'
import { FaAngleDown, FaFilter } from 'react-icons/fa'
import { MdClear } from 'react-icons/md'
import { Calendar22 } from '../datePicker/Calendar22'
import MultiSelect from '../form/MultiSelect'
import Select from '../form/Select'
import { Button } from '../ui/button'

type FilterForm = {
    uid?: string
    search?: string
    startDate?: Date
    endDate?: Date
    selectedLabels?: string[]
}

type UserWithLastAssign = TypeUser & (TypeAssign extends Array<infer U> ? U : never)

export type FilterBarProps = {
    onFilteredChange: (rows: UserWithLastAssign[]) => void
    searchTerm: string,
}


const FilterBar = memo(function FilterBarComponent({
    onFilteredChange,
    searchTerm,
}: FilterBarProps) {
    const { clerkUsers } = useAdmin()
    const { isLeader } = useCurrentUser()
    const { users } = useUsers()

    const { register, control, reset, getValues } = useForm<FilterForm>({
        defaultValues: {
            uid: '',
            search: '',
            startDate: undefined,
            endDate: undefined,
            selectedLabels: [],
        },
    })

    const sales = React.useMemo(
        () => clerkUsers.map((sale) => ({ label: sale.username ?? '', value: sale.id })),
        [clerkUsers]
    )

    const [appliedFilters, setAppliedFilters] = React.useState<{
        uid?: string
        start?: number
        end?: number
        labels: string[]
    }>({ uid: undefined, start: undefined, end: undefined, labels: [] })

    const labelOptions = React.useMemo(() => {
        const opts = Array.from(
            new Set(users.flatMap((u) => u.labels ?? []).map((l) => String(l ?? '').trim()))
        )
            .filter(Boolean)
            .map((l) => ({ value: l, text: l }))
        return opts
    }, [users])

    const normalizeMs = (ts?: number) => {
        if (!ts) return undefined
        return ts < 1e12 ? ts * 1000 : ts
    }

    const filteredData = React.useMemo(() => {
        const hasSearch = (searchTerm?.trim().length ?? 0) > 0
        const dateStart = appliedFilters.start ?? Number.MIN_SAFE_INTEGER
        const dateEnd = appliedFilters.end ?? Number.MAX_SAFE_INTEGER
        const normalizedAppliedLabelsSet = new Set(
            appliedFilters.labels.map((a) => String(a ?? '').trim().toLowerCase()).filter(Boolean)
        )
        const hasLabelFilter = normalizedAppliedLabelsSet.size > 0

        const mapped = users.map((user) => {
            const lastAssign =
                Array.isArray(user.assign) && user.assign.length > 0
                    ? user.assign[user.assign.length - 1]
                    : undefined
            const assignAt = normalizeMs((lastAssign?.assignAt as number | undefined) ?? undefined)
            return { ...user, ...(lastAssign ?? {}), assignAt }
        }) as Array<UserWithLastAssign & { assignAt?: number }>

        const step1 = mapped.filter((user) => {
            if (appliedFilters.uid && user.uid !== appliedFilters.uid) return false
            if (!user.assignAt || user.assignAt < dateStart || user.assignAt > dateEnd) return false
            return true
        })


        let step2 = step1
        if (hasSearch) {
            const q = searchTerm.toLowerCase()
            step2 = step1.filter((user) => {
                const uid = String(user.uid ?? '').toLowerCase()
                const name = String(user.name ?? '').toLowerCase()
                const phone = String(user.phone ?? '').toLowerCase()
                const status = String(user.status ?? '').toLowerCase()
                const source = String(user.source ?? '').toLowerCase()
                return (
                    uid.includes(q) ||
                    name.includes(q) ||
                    phone.includes(q) ||
                    status.includes(q) ||
                    source.includes(q)
                )
            })

        }

        let step3 = step2
        if (hasLabelFilter) {
            step3 = step2.filter((user) => {
                const labels = (user.labels ?? []).map((l) => String(l ?? '').trim().toLowerCase())
                return labels.some((l) => normalizedAppliedLabelsSet.has(l))
            })

        }

        const out = orderBy(step3, 'des', 'assignAt') as UserWithLastAssign[]
        return out
    }, [users, appliedFilters, searchTerm])

    React.useEffect(() => {
        onFilteredChange(filteredData)
    }, [filteredData, onFilteredChange])

    const toStartMs = (d?: Date) =>
        d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime() : undefined
    const toEndMs = (d?: Date) =>
        d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime() : undefined

    const handleApplyFilter = React.useCallback(() => {
        const currentValues = getValues()
        const isEmpty =
            !currentValues.uid &&
            !currentValues.startDate &&
            !currentValues.endDate &&
            (!currentValues.selectedLabels || currentValues.selectedLabels.length === 0)

        if (isEmpty) {
            setAppliedFilters({ uid: undefined, start: undefined, end: undefined, labels: [] })
            return
        }

        const s = toStartMs(currentValues.startDate)
        const e = toEndMs(currentValues.endDate)
        let start = s
        let end = e
        if (s && e && s > e) {
            start = e
            end = s
        }

        setAppliedFilters({
            uid: currentValues.uid ? currentValues.uid : undefined,
            start,
            end,
            labels: currentValues.selectedLabels ?? [],
        })
    }, [getValues])

    React.useEffect(() => {
        handleApplyFilter()
    }, [handleApplyFilter])

    const handleClearFilter = () => {
        reset({ uid: '', startDate: undefined, endDate: undefined, selectedLabels: [] })
        setAppliedFilters({ uid: undefined, start: undefined, end: undefined, labels: [] })
    }

    const hanldeExport = () => {
        const headers = [
            'Ngày Nhập',
            'Tên',
            'Số Điện Thoại',
            'Người Chăm Sóc',
            'Cập Nhật Lần Cuối',
            'Tình Trạng',
            'Nguồn Khách',
        ]
        const rows = filteredData.map((user) => [
            new Date(user.assignAt || 0).toLocaleString('vi-VN'),
            user.name,
            user.phone,
            user.employeeName,
            new Date(user.lasteUpadteAt || 0).toLocaleString('vi-VN'),
            user.status,
            user.source,
        ])

        const csvContent =
            '\uFEFF' +
            [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
                '\n'
            )

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `users_${new Date().getTime()}.csv`
        link.click()
    }

    return (
        <div className="p-5 flex lg:items-center gap-3 flex-col lg:flex-row">
            {isLeader && (
                <div className="relative">
                    <Select
                        options={sales}
                        placeholder="Chọn Người Chăm Sóc"
                        className="dark:bg-dark-900 min-w-[100px]"
                        {...register('uid')}
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <FaAngleDown />
                    </span>
                </div>
            )}
            <Controller
                name="selectedLabels"
                control={control}
                render={({ field }) => (
                    <div className="relative">
                        <MultiSelect
                            options={labelOptions}
                            placeholder="Chọn nhãn"
                            value={field.value ?? []}
                            onChange={field.onChange}
                            className="min-w-[150px]"
                        />
                    </div>
                )}
            />
            <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                    <div className="flex gap-2 items-center">
                        <Calendar22 value={field.value} onSelect={field.onChange} placeholder="Ngày bắt đầu" />
                        /
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field: endField }) => (
                                <Calendar22 value={endField.value} onSelect={endField.onChange} placeholder="Ngày kết thúc" />
                            )}
                        />
                    </div>
                )}
            />
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleApplyFilter} title="Áp dụng bộ lọc" aria-label="Áp dụng bộ lọc">
                    <FaFilter />
                </Button>
                <Button size="sm" onClick={handleClearFilter} title="Xóa Lọc" aria-label="Xóa Lọc">
                    <MdClear />
                </Button>
                <Button size="sm" onClick={hanldeExport} title="Xuất Excel" aria-label="Xuất Excel">
                    <CgExport />
                </Button>
            </div>
        </div>
    )
})

export default FilterBar

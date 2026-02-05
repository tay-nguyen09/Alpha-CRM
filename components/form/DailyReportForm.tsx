"use client"
import React from 'react'
import ComponentCard from '@/components/common/ComponentCard'
import Input from './input/InputField'
import TextArea from './input/TextArea'
import { useUsers } from '@/hooks/useUsers'
import { getUserByDocId } from '@/lib/redux/features/firebase/firebaseAPI'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-toastify'
import { useForm, useWatch, Controller } from 'react-hook-form'
import Label from './Label'
import { timeStamp } from '@/utils/shared/common'
import { TypeDailyReport, TypeUser } from '@/types/firebase'
import Checkbox from './input/Checkbox'
import { Button } from '../ui/button'

type Props = {
    docId: string
}

type TypeForm = {
    date: number
    callMade?: boolean
    messageSent?: boolean
    hasResponse?: boolean
    progress?: string
    note?: string
}

const startOfDay = (ts: number) => {
    const d = new Date(ts)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
}

export default function DailyReportForm({ docId }: Props) {
    const { updateUserByDocId } = useUsers()
    const currentUser = useUser()
    const [now, setNow] = React.useState<number>(() => Date.now())
    React.useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 60 * 1000)
        return () => clearInterval(t)
    }, [])

    const form = useForm<TypeForm>({ defaultValues: { date: startOfDay(now), callMade: false, messageSent: false, hasResponse: false, progress: "", note: "" } })
    const { register, reset, handleSubmit, control } = form

    const dateVal = useWatch({ control, name: 'date' })

    React.useEffect(() => {
        (async () => {
            try {
                const res = await getUserByDocId(docId) as TypeUser
                const daily = res.dailyReports as TypeDailyReport[] | undefined
                const today = startOfDay(Date.now())
                if (daily && daily.length > 0) {
                    const todayReport = daily.find(r => r.updatedAt === today)
                    if (todayReport) {
                        reset({
                            date: todayReport.updatedAt,
                            callMade: !!todayReport.callMade,
                            messageSent: !!todayReport.messageSent,
                            hasResponse: !!todayReport.hasResponse,
                            progress: todayReport.progress ?? "",
                            note: todayReport.note ?? ""
                        })
                        return
                    }
                }
                // default reset
                reset({ date: today, callMade: false, messageSent: false, hasResponse: false, progress: "", note: "" })
            } catch (e) {
                console.error(e)
            }
        })()
    }, [docId, reset])

    const onSubmit = async (data: TypeForm) => {
        try {
            const res = await getUserByDocId(docId) as TypeUser
            const daily = res.dailyReports as TypeDailyReport[] | undefined
            const today = startOfDay(data.date)
            const newReport: TypeDailyReport = {
                updatedAt: today,
                callMade: !!data.callMade,
                messageSent: !!data.messageSent,
                hasResponse: !!data.hasResponse,
                progress: data.progress ?? "",
                note: data.note ?? "",
                createdBy: currentUser.user?.id,
                createdAt: timeStamp()
            }
            const nextDaily = (daily ?? []).filter(r => r.updatedAt !== today)
            nextDaily.push(newReport)
            await updateUserByDocId({
                docId, data: { dailyReports: nextDaily },
                action: {
                    action: "update_daily_report",
                    note: `Cập nhật báo cáo ngày ${new Date(today).toLocaleDateString()}`
                }
            })
            toast.success('Báo cáo đã được lưu')
            reset({ date: today, callMade: false, messageSent: false, hasResponse: false, progress: "", note: "" })
        } catch (e) {
            console.error(e)
            toast.error('Lưu báo cáo thất bại')
        }
    }

    return (
        <ComponentCard>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className='space-y-4'>
                    <div>
                        <Label>Ngày</Label>
                        <Input type="text" required disabled value={new Date(dateVal || startOfDay(now)).toLocaleDateString()} />
                    </div>
                    <div className='flex flex-col gap-4'>
                        <div className='flex '>
                            <Controller control={control} name="callMade" render={({ field }) => (
                                <Checkbox label="Có gọi điện không ?" checked={!!field.value} onChange={field.onChange} />
                            )} />
                        </div>
                        <div>
                            <Controller control={control} name="messageSent" render={({ field }) => (
                                <Checkbox label="Có nhắn tin không ?" checked={!!field.value} onChange={field.onChange} />
                            )} />
                        </div>
                        <div>
                            <Controller control={control} name="hasResponse" render={({ field }) => (
                                <Checkbox label="Có phản hồi không ?" checked={!!field.value} onChange={field.onChange} />
                            )} />
                        </div>
                    </div>
                    <div>
                        <Label>Có tiến triển gì mới không ?</Label>
                        <TextArea
                            {...register('progress')}
                            placeholder='(Có hỏi thăm, Có hẹn lại,...)'
                        />
                    </div>
                    <div>
                        <Label>Note</Label>
                        <TextArea
                            {...register('note')}
                            placeholder='Ghi chú'
                        />
                    </div>
                    <div className='flex gap-2'>
                        <Button className='flex-1' variant='outline' type='button' onClick={() => reset()} >Huỷ</Button>
                        <Button className='flex-1' type='submit'>Lưu Báo Cáo</Button>
                    </div>
                </div>
            </form>
        </ComponentCard>
    )
}

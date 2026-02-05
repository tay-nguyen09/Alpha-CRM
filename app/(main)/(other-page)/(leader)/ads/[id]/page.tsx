'use client';
import CampaignInfoOnly from '@/components/campaign/CampaignInfoOnly';
import ComponentCard from '@/components/common/ComponentCard';
import { Calendar22 } from '@/components/datePicker/Calendar22';
import DropzoneComponent from '@/components/form/form-elements/DropZone';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import MultiSelect from '@/components/form/MultiSelect';
import Select from '@/components/form/Select';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getCampaignByDocId } from '@/lib/redux/features/campaigns/campaignsAPI';
import { updateCampaignAsync } from '@/lib/redux/features/campaigns/campaignsSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { TypeCampaign, TypeCampaignStatus, TypeTeamMember } from '@/types/form';
import { formatAccountingNumber } from '@/utils/shared/string';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

type FormValues = {
    name: string;
    sourceUrl: string;
    status: TypeCampaignStatus;
    adsLink: string;
    budget: string;
    startAt: Date;
    endAt: Date | null;
    content: string;
    teamMembers: string[];
    imageUrl?: string;
};

const rules = {
    name: {
        required: "Vui lòng Nhập Tên Chiến Dịch !!",
        minLength: { value: 2, message: "Tên Chiến Dịch Ít nhất phải có 2 ký tự" },
        validate: (v: string) =>
            !/^\d+$/.test(v.trim()) || "Tên không thể chỉ là số",
    },
    adsLink: {
        required: "Vui lòng Nhập Link Quảng Cáo !!",
        minLength: { value: 2, message: "Link Quảng Cáo Ít nhất phải có 2 ký tự" },
        validate: (v: string) =>
            !/^\d+$/.test(v.trim()) || "Link không thể chỉ là số",
    },
    status: {
        minLength: { value: 2, message: "Ít nhất phải có 2 ký tự" },
        required: "Vui lòng chọn Trạng Thái !!",
    }
} as const;

const options = [
    { value: 'running', label: 'Đang chạy' },
    { value: 'paused', label: 'Tạm dừng' },
    { value: 'stopped', label: 'Đã Ngừng' },
]
export default function NewCampaignPage() {
    const { id } = useParams<{ id: string; }>()
    const router = useRouter();
    const dispatch = useAppDispatch();
    const isEdit = useSearchParams().get("isEdit");

    const [creating, setCreating] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const { allSalesCurrentTeam } = useAdmin();
    const { userId } = useCurrentUser();

    const memberOptions = React.useMemo(
        () =>
            (allSalesCurrentTeam ?? []).map((user) => ({
                value: user.id as string,
                text: user.username as string,
            })),
        [allSalesCurrentTeam]
    );

    const form = useForm<FormValues>({
        defaultValues: {
            name: '',
            status: 'running',
            adsLink: '',
            budget: '',
            startAt: new Date(),
            endAt: null,
            content: '',
            teamMembers: [],
            imageUrl: '',
        }
    });
    const { register, handleSubmit, control, reset, formState: { errors } } = form
    const validate = (data: FormValues): string | null => {
        if (!data.name.trim()) return 'Tên chiến dịch là bắt buộc';
        if (!data.status) return 'Trạng thái là bắt buộc';
        if (data.budget && Number.isNaN(Number(data.budget))) return 'Ngân sách không hợp lệ';
        if (data.startAt && data.endAt) {
            const s = data.startAt.getTime();
            const e = data.endAt.getTime();
            if (!Number.isFinite(s) || !Number.isFinite(e)) return 'Ngày không hợp lệ';
            if (e < s) return 'Ngày kết thúc phải sau ngày bắt đầu';
        }
        return null;
    };

    const onSubmit = async (data: FormValues) => {
        setError(null);
        setSuccess(null);
        const v = validate(data);
        if (v) {
            setError(v);
            return;
        }
        setCreating(true);
        try {
            const now = new Date().getTime();

            const metadata: TypeCampaign = {
                ...data,
                createdAt: now,
                startAt: data.startAt.getTime(),
                endAt: data.endAt ? data.endAt.getTime() : null,
                createdBy: userId as string,
                teamMembers: data.teamMembers.map((memberId) => {
                    const employee = allSalesCurrentTeam?.find(m => m.id === memberId)
                    return {
                        clerkId: employee?.id as string,
                        createdAt: now,
                        name: employee?.username as string,
                        activitys: [
                            {
                                createdAt: now,
                                type: "added"
                            }
                        ],
                    }
                }),
            }
            await dispatch(updateCampaignAsync({ id, data: metadata })).unwrap();
            setSuccess('Tạo chiến dịch thành công');
            reset();
            setTimeout(() => router.push('/ads'), 800);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('Lỗi không xác định');
            }
        } finally {
            setCreating(false);
        }
    };

    React.useEffect(() => {
        (async () => {
            try {
                const res = await getCampaignByDocId(id) as TypeCampaign;
                if (!res || !res.name) {
                    router.replace('/not-found');
                    return;
                }
                reset({
                    name: res.name,
                    sourceUrl: res.sourceUrl,
                    status: res.status || 'running',
                    adsLink: res.adsLink,
                    budget: res.budget ? String(res.budget) : '',
                    startAt: res.startAt ? new Date(res.startAt) : new Date(),
                    endAt: res.endAt ? new Date(res.endAt) : null,
                    content: res.content,
                    teamMembers: Array.isArray(res.teamMembers) ? res.teamMembers.map((m: TypeTeamMember) => m.clerkId) : [],
                });
            } catch (error) {
                router.replace('/not-found');
            }
        })();
    }, [id, reset]);

    if (isEdit !== 'true') {
        return <CampaignInfoOnly />
    }

    return (
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <ComponentCard title="Chỉnh sửa chiến dịch">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="my-5 flex flex-col gap-4">
                        <Controller
                            control={control}
                            name="sourceUrl"
                            render={({ field }) => (
                                <DropzoneComponent
                                    title="Tải lên hình ảnh hoặc video của chiến dịch"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        <div>
                            <Label>Tên Chiến Dịch</Label>
                            <Input
                                type="text"
                                {...register('name', { required: true })}
                                error={!!errors.name}
                                hint={errors.name?.message || undefined}
                                placeholder="VD: Chiến dịch Video Q1"
                            />
                            {errors.name && <span className="text-xs text-red-500">Bắt buộc</span>}
                        </div>
                        <div>
                            <Label>Link Bài Viết</Label>
                            <Input
                                type="text"
                                {...register('adsLink')}
                                placeholder="VD: https://facebook.com/your-post-link"
                            />
                        </div>
                        <div>
                            <Label>Trạng Thái</Label>
                            <Select
                                options={options}
                                placeholder="Chọn trạng thái"
                                className="dark:bg-dark-900"
                                {...register("status")}
                            />
                        </div>
                        <div>
                            <Label>Ngân Sách ( vnđ )</Label>
                            <Controller
                                control={control}
                                name="budget"
                                render={({ field }) => {
                                    return (
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatAccountingNumber(field.value)}
                                            onChange={e => {
                                                // Only allow digits, remove commas
                                                const raw = e.target.value.replace(/[^\d]/g, '');
                                                field.onChange(raw);
                                            }}
                                            placeholder="VD: 1.000.000"
                                            className="text-left"
                                        />
                                    );
                                }}
                            />
                        </div>
                        <div>
                            <Label>Thành Viên Tham Gia</Label>
                            <Controller
                                control={form.control}
                                name="teamMembers"
                                render={({ field }) => (
                                    <MultiSelect
                                        placeholder="(Chưa chọn thành viên)"
                                        options={memberOptions}
                                        value={field.value ?? []}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </div>
                        <div className='flex gap-5'>
                            <div>
                                <Label>Ngày Bắt Đầu</Label>
                                <Controller
                                    control={control}
                                    name="startAt"
                                    render={({ field }) => (
                                        <Calendar22
                                            value={field.value || undefined}
                                            onSelect={field.onChange}
                                            placeholder="Ngày bắt đầu"
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <Label>Ngày Kết Thúc</Label>
                                <Controller
                                    control={control}
                                    name="endAt"
                                    render={({ field }) => (
                                        <Calendar22
                                            value={field.value || undefined}
                                            onSelect={field.onChange}
                                            placeholder="Ngày kết thúc"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Nội Dung Bài Viết</Label>
                            <TextArea
                                {...register('content')}
                                className='min-h-[200px]'
                                placeholder='Nhập nội dung bài viết quảng cáo tại đây...'
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <Button
                            type="button"
                            onClick={() => router.push('/ads')}
                            disabled={creating}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="px-3 py-1 rounded bg-green-600 text-white"
                            disabled={creating}
                        >
                            {creating ? 'Đang Cập Nhật...' : 'Cập Nhật chiến dịch'}
                        </Button>
                    </div>
                    {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
                    {success && <div className="mt-3 text-sm text-green-600">{success}</div>}
                </form>
            </ComponentCard>
        </div>
    );
}

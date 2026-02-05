'use client';
import ComponentCard from '@/components/common/ComponentCard';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { PrimaryTooltip } from '@/components/common/PrimaryTooltip';
import SourceImgAndVideo from '@/components/common/SourceImgAndVideo';
import Select from '@/components/form/Select';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { useCampaign } from '@/hooks/useCampaign';
import { updateCampaignAsync } from '@/lib/redux/features/campaigns/campaignsSlice';
import { useAppDispatch } from '@/lib/redux/hooks';
import { TypeCampaign, TypeCampaignStatus } from '@/types/form';
import { formatAccountingNumber } from '@/utils/shared/string';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { FaLink, FaPlay, FaStopCircle } from 'react-icons/fa';
import { IoMdPause } from 'react-icons/io';
import { toast } from 'react-toastify';


const CampaignStatus = ({ status }: { status: TypeCampaignStatus }) => {
    switch (status) {
        case "running":
            return (
                <PrimaryTooltip content="Đang chạy">
                    <span className="inline-flex items-center animate-pulse">
                        <FaPlay className="text-green-400 drop-shadow-md" />
                    </span>
                </PrimaryTooltip>

            );
        case "paused":
            return (
                <PrimaryTooltip content="Tạm dừng">
                    <span className="inline-flex items-center animate-bounce">
                        <IoMdPause className="text-orange-400 drop-shadow-md" />
                    </span>
                </PrimaryTooltip>
            );
        case "stopped":
            return (
                <PrimaryTooltip content="Tạm dừng">
                    <span className="inline-flex items-center animate-spin-slow">
                        <FaStopCircle className="text-red-500 drop-shadow-md" />
                    </span>
                </PrimaryTooltip>
            );

            return <></>;
    }
    // Custom slow spin animation
    // Add this to your global CSS if not available:
    // .animate-spin-slow { animation: spin 2.5s linear infinite; }
}

const CampaignTitle = ({ name, adsLink }: { name: string, adsLink: string }) => {
    return (
        <Link href={adsLink || ""} target='_blank' className="flex gap-2 items-center text-lg font-medium text-gray-800 dark:text-white/90 ">
            {name}<FaLink />
        </Link>
    );
}
const options = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'running', label: 'Đang chạy' },
    { value: 'paused', label: 'Tạm dừng' },
    { value: 'completed', label: 'Hoàn tất' },
]
export default function CampaignsPage() {
    const { control, watch, register } = useForm<{ status: 'all' | TypeCampaignStatus }>({
        defaultValues: { status: 'all' }
    });
    const status = watch('status');
    const router = useRouter();
    const { clerkUsers } = useAdmin()
    const { campaigns: allCampaigns, isLoading } = useCampaign();
    const dispatch = useAppDispatch();
    const campaigns: TypeCampaign[] = React.useMemo(() => {
        let filtered = allCampaigns
        if (status !== 'all') filtered = filtered.filter(c => c.status === status);
        return filtered;
    }, [allCampaigns, status]);

    const handleChangeCampaignStatus = (id: string, status: TypeCampaignStatus) => {
        try {
            dispatch(updateCampaignAsync({ id, data: { status } }));
            toast.success(`Chiến dịch đã được cập nhật trạng thái thành công.`);
        } catch (error) {
            toast.error('Đã có lỗi xảy ra khi cập nhật trạng thái chiến dịch.');
        }
    }
    const handleGetCreatorName = (creatorId: string) => {
        const creator = clerkUsers.find(c => c.id === creatorId);
        return creator ? creator.username : 'Không xác định';
    }
    return (
        <div className="p-4 space-y-4">
            <PageBreadcrumb pageTitle="Quản Lý Chiến Dịch Quảng Cáo" />

            <ComponentCard title="Danh Sách Chiến Dịch Quảng Cáo"
                button={
                    <Button onClick={() => router.push('/ads/new')}>
                        Tạo Chiến Dịch mới
                    </Button>
                }
            >
                <div className="flex gap-2 items-center">
                    <Select
                        options={options}
                        placeholder="Chọn trạng thái"
                        className="dark:bg-dark-900 w-fit"
                        {...register("status")}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {campaigns.length === 0 && !isLoading && (
                        <div className="text-gray-500">Không có dữ liệu</div>
                    )}
                    {campaigns.map(c => (
                        <ComponentCard key={c.id} title={<CampaignTitle name={c.name} adsLink={c.adsLink} />}
                            button={<CampaignStatus status={c.status} />}
                        >
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <SourceImgAndVideo url={c.sourceUrl} />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="w-full text-xl font-semibold">{c.name || c.id}</div>
                                    <div className="text-xs text-gray-500 mt-1">Ngân sách: <span className="font-medium text-blue-600">{formatAccountingNumber(c.budget)}</span></div>
                                    <div className="text-xs text-gray-500 mt-1">Tạo bởi: <span className="font-medium text-blue-600">{handleGetCreatorName(c.createdBy)}</span></div>
                                </div>
                            </div>
                            <div className="flex justify-between gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/ads/${c.id}`)}
                                >
                                    Chi Tiết
                                </Button>
                                <div className='flex gap-2'>
                                    {
                                        c.status == 'running' ?
                                            <>
                                                <PrimaryTooltip content="Dừng chiến dịch" >
                                                    <Button
                                                        onClick={() => handleChangeCampaignStatus(c.id as string, 'stopped')}
                                                        className='bg-red-400'
                                                        variant="default"
                                                    >
                                                        <FaStopCircle />
                                                    </Button >
                                                </PrimaryTooltip>
                                                <PrimaryTooltip content="Tạm dừng chiến dịch">
                                                    <Button
                                                        onClick={() => handleChangeCampaignStatus(c.id as string, 'paused')}
                                                        className='bg-orange-400'
                                                        variant="default"
                                                    >
                                                        <IoMdPause />
                                                    </Button>
                                                </PrimaryTooltip>
                                            </>
                                            :
                                            <>
                                                <PrimaryTooltip content="Bật chiến dịch">
                                                    <Button
                                                        onClick={() => handleChangeCampaignStatus(c.id as string, 'running')}
                                                        className='bg-green-400'
                                                        variant="default"
                                                    >
                                                        <FaPlay />
                                                    </Button>
                                                </PrimaryTooltip>
                                            </>

                                    }

                                </div>
                            </div>
                        </ComponentCard>
                    ))}

                </div>

                {isLoading && <div className="text-gray-500">Đang tải...</div>}
            </ComponentCard>

        </div>
    );
}

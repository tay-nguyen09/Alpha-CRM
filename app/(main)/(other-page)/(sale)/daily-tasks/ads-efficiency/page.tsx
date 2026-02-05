"use client"
import ComponentCard from '@/components/common/ComponentCard';
import { PrimaryTooltip } from '@/components/common/PrimaryTooltip';
import SourceImgAndVideo from '@/components/common/SourceImgAndVideo';
import PrimaryDialog from '@/components/dialog/PrimaryDialog';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Label from '@/components/form/Label';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCampaign } from '@/hooks/useCampaign';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { TypeAdsReport, TypeCampaign, TypeCampaignStatus, TypeDailyAdsReport } from '@/types/form';
import { timeStamp } from '@/utils/shared/common';
import { formatAccountingNumber } from '@/utils/shared/string';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FaLink, FaPlay, FaStopCircle } from 'react-icons/fa';
import { IoMdPause } from 'react-icons/io';
import { toast } from 'react-toastify';

const CampaignTitle = ({ name, adsLink }: { name: string, adsLink: string }) => {
    return (
        <Link href={adsLink || ""} target='_blank' className="flex gap-2 items-center text-lg font-medium text-gray-800 dark:text-white/90 ">
            {name}<FaLink />
        </Link>
    );
}

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
}

const defaultValue = {
    total: 0,
    spam: 0,
    replied: 0,
    refCustomers: 0,
    newRegisters: 0,
    paidCustomers: 0,
    note: '',
}

const Home = () => {

    const { campaigns, addDailyReportAds, dailyReportAdsToDay, updateDailyReportAds } = useCampaign();
    const router = useRouter();
    const { userId, userName } = useCurrentUser()

    const { register, handleSubmit, reset, formState: { errors } } = useForm<TypeAdsReport>({
        defaultValues: defaultValue
    });

    const onSubmit = (data: TypeAdsReport) => {
        try {
            if (!!dailyReportAdsToDay.find((_) => _.campaignId === data.campaignId)) {
                updateDailyReportAds(data.campaignId as string, { metadata: data, updatedAt: timeStamp() })
                toast.success("Cập nhật báo cáo thành công!")
                return;
            }
            const metadata: TypeDailyAdsReport = {
                createdAt: timeStamp(),
                updatedAt: timeStamp(),
                clerkId: userId || '',
                username: userName || '',
                metadata: data,
                campaignId: data.campaignId
            }
            addDailyReportAds(metadata)
            toast.success("Đã gửi báo cáo thành công!")
            reset();
        } catch (error) {
            toast.error("Thất bại, vui lòng thử lại!")
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Danh sách quảng cáo</h2>
            <ul className="space-y-2 flex gap-5">
                {Array.isArray(campaigns) && campaigns.length > 0 ? (
                    campaigns.map((c: TypeCampaign) => (
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
                                </div>
                            </div>
                            <div className="flex justify-between gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/ads/${c.id}`)}
                                >
                                    Chi Tiết
                                </Button>
                                <PrimaryDialog
                                    buttonOpen={!!dailyReportAdsToDay.find((_) => _.campaignId === c.id) ? "Chỉnh Sửa Báo Cáo" : "Báo cáo hôm nay"}
                                    onConfirm={handleSubmit(onSubmit)}
                                    onOpen={() => {
                                        const camp = dailyReportAdsToDay.find((_) => _.campaignId === c.id);
                                        if (!!camp) {
                                            reset(camp.metadata)
                                        } else {
                                            reset(defaultValue)
                                        }
                                    }}
                                >
                                    <form className="flex flex-col gap-3" >
                                        <DialogHeader>
                                            <DialogTitle>Báo cáo số liệu quảng cáo</DialogTitle>
                                        </DialogHeader>
                                        <Input
                                            className='hidden'
                                            {...register('campaignId', { required: 'Bắt buộc' })}
                                            placeholder="VD: 100"
                                            defaultValue={c.id}
                                        />
                                        <div>
                                            <Label className="block mb-1">Số Mess Đổ Về</Label>
                                            <Input
                                                type='number'
                                                {...register('total', { required: 'Bắt buộc' })}
                                                placeholder="VD: 100"
                                                error={!!errors.total}
                                                hint={errors.total?.message}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Mess Rác</Label>
                                            <Input
                                                type='number'
                                                {...register('spam', { required: 'Bắt buộc' })}
                                                placeholder="VD: 10"
                                                error={!!errors.spam}
                                                hint={errors.spam?.message}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Mess Có Phản Hồi</Label>
                                            <Input
                                                type='number'
                                                {...register('replied', { required: 'Bắt buộc' })}
                                                placeholder="VD: 50"
                                                error={!!errors.replied}
                                                hint={errors.replied?.message}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Số lượng khách than khảo</Label>
                                            <Input
                                                type='number'
                                                {...register('refCustomers', { required: 'Bắt buộc' })}
                                                placeholder="VD: 100"
                                                error={!!errors.refCustomers}
                                                hint={errors.refCustomers?.message}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Số lượt đăng ký mới</Label>
                                            <Input
                                                type='number'
                                                {...register('newRegisters', { required: 'Bắt buộc' })}
                                                placeholder="VD: 100"
                                                error={!!errors.newRegisters}
                                                hint={errors.newRegisters?.message}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">SL Khách Nạp Đầu</Label>
                                            <Input
                                                type='number'
                                                {...register('paidCustomers', { required: 'Bắt buộc' })}
                                                placeholder="VD: 100"
                                                error={!!errors.paidCustomers}
                                                hint={errors.paidCustomers?.message}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1">Ghi Chú</Label>
                                            <TextArea
                                                {...register('note')}
                                                className='min-h-[200px]'
                                                placeholder="Khách hàng chỉ hỏi, khách hàng không muốn tham gia thị trường,..."
                                            />
                                        </div>
                                    </form>
                                </PrimaryDialog>

                            </div>
                        </ComponentCard>
                    ))
                ) : (
                    <li className="text-gray-500">Không có quảng cáo nào</li>
                )}
            </ul>
        </div>
    );
}

export default Home
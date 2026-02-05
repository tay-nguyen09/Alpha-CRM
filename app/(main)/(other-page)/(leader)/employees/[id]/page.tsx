'use client'
import NotFound from '@/app/not-found';
import EmloyessInfoCard from '@/components/emloyees-profile/EmloyessInfoCard';
import EmloyessMetaCard from '@/components/emloyees-profile/EmloyessMetaCard';
import UserInfoCard from '@/components/user-profile/UserInfoCard';
import UserMetaCard from '@/components/user-profile/UserMetaCard';
import { useAdmin } from '@/hooks/useAdmin';
import { useParams } from 'next/navigation';

const Page = () => {
    const { id } = useParams<{ id: string; }>()
    const { allSalesCurrentTeam } = useAdmin()
    const _ = allSalesCurrentTeam.find(u => u.id === id)
    if (!_) {
        return <NotFound />
    }
    return (
        <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                    Chi Tiết Nhân Viên
                </h3>
                <div className="space-y-6">
                    <EmloyessMetaCard emloyees={_} />
                    <EmloyessInfoCard emloyees={_} />
                    {/* <UserAddressCard userDoc={_} /> */}
                </div>
            </div>
        </div>
    )
}

export default Page
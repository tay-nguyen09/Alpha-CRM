'use client'
import NotFound from '@/app/not-found';
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from '@/components/user-profile/UserMetaCard';
import { useUsers } from '@/hooks/useUsers';
import { useParams } from 'next/navigation';


export default function Profile() {
    const { id } = useParams<{ id: string; }>()
    const { allUsers } = useUsers()
    const _ = allUsers.find(u => u.id === id)

    if (!_) {
        return <NotFound />
    }
    return (
        <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                    Chi Tiết Liên Hệ
                </h3>
                <div className="space-y-6">
                    <UserMetaCard userDoc={_} />
                    <UserInfoCard userDoc={_} />
                    {/* <UserAddressCard userDoc={_} /> */}
                </div>
            </div>
        </div>
    );
}

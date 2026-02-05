'use client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const Layout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { isLeader } = useCurrentUser()

    if (!isLeader) {
        return (
            <div className='text-center text-gray-500 dark:text-gray-400 py-12'>
                Bạn không có quyền truy cập trang này
            </div>
        )
    }
    return children
}

export default Layout
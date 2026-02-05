'use client'
import ComponentCard from '@/components/common/ComponentCard'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import { PrimaryTooltip } from '@/components/common/PrimaryTooltip';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useAdmin } from '@/hooks/useAdmin'
import { User } from '@clerk/backend';
import Link from 'next/link';
import { FaInfo } from 'react-icons/fa';

const Home = () => {
    const { allSalesCurrentTeam } = useAdmin();
    return (
        <div>
            <PageBreadcrumb pageTitle="Quản Lý Nhân Viên" />
            <ComponentCard>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Avatar
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Tên đầy đủ
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Tổ
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                User Name
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Vị Trí
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                Tương Tác
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allSalesCurrentTeam && allSalesCurrentTeam.length > 0 ? (
                            allSalesCurrentTeam.map((user: User) => (
                                <TableRow key={user.id}>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                        <img src={user.imageUrl} alt={user.fullName || user.username || "avatar"} className="w-10 h-10 rounded-full object-cover" />
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                        {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                        {user.publicMetadata?.team_id as string || `_`}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                        {user.username || "-"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                        {user.publicMetadata?.role as string || "-"}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                        <PrimaryTooltip content="Thông tin chi tiết">
                                            <Link href={`/employees/${user.id}`}>
                                                <Button className='' variant="outline">
                                                    <FaInfo />
                                                </Button>
                                            </Link>
                                        </PrimaryTooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="px-4 py-3 text-gray-500 text-center">Không có nhân viên nào</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ComponentCard>
        </div>
    )
}

export default Home
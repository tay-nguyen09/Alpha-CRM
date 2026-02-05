"use client"
import { TypeAssign, TypeUser } from '@/types/firebase';
import React from 'react';
import { useForm } from 'react-hook-form';
import PrimaryNavigation from '../navigation/PrimaryNavigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import ContactRow from './ContactRow';
import FilterBar from './FilterBar';
import SearchBar from './SearchBar';

export type TypePagination = {
    page: number;
    pageSize: number;
}
type UserWithLastAssign = TypeUser & (TypeAssign extends Array<infer U> ? U : never)



const SecondTable = () => {

    const [searchText, setSearchText] = React.useState<string>("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState<string>("")
    const [filteredUsers, setFilteredUsers] = React.useState<UserWithLastAssign[]>([])
    const [pagination, setPagination] = React.useState<{ pageIndex: number; pageSize: number }>({
        pageIndex: 1,
        pageSize: 10,
    })

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchText)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchText])

    return (
        <div className="rounded-xl border border-gray-400  dark:border-white/5 bg-white dark:bg-white/3" >
            <div className='flex flex-col px-2 sticky top-16 z-50 backdrop-blur-3xl rounded-t-xl'>
                <div className='flex items-center'>
                    <div className='w-fit'>
                        <SearchBar value={searchText} onSearchChange={setSearchText} />
                    </div>
                    <FilterBar
                        onFilteredChange={setFilteredUsers}
                        searchTerm={debouncedSearchTerm}
                    />
                </div>
                <PrimaryNavigation
                    count={filteredUsers.length || 0}
                    onChange={(pageIndex, pageSize) => setPagination({ pageIndex, pageSize })}
                />
            </div>
            <div className="overflow-x-auto" >
                <div className={filteredUsers.length === 0 ? "min-w-full" : "min-w-275.5"} >
                    <Table>
                        <TableHeader className="border-b border-gray-400 dark:border-white/5" >
                            <TableRow>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Ngày Nhập
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Tên
                                </TableCell>
                                < TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Số Điện Thoại
                                </TableCell>
                                < TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Người Chăm Sóc
                                </TableCell>
                                < TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Cập Nhật Lần cuối
                                </TableCell>

                                < TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Tình Trạng
                                </TableCell>
                                < TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Nguồn Khách
                                </TableCell>
                                < TableCell
                                    isHeader
                                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    Tùy chọn
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-400 dark:divide-white/5">
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-20 text-center text-gray-500 dark:text-gray-400 font-bold text-2xl">
                                        (TRỐNG...)
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.slice(pagination.pageSize * (pagination.pageIndex - 1), pagination.pageSize * pagination.pageIndex).map((order: UserWithLastAssign) => (
                                    <ContactRow
                                        key={order.id}
                                        user={order}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

export default SecondTable
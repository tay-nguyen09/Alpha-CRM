'use client'
import React from 'react'
import { Button } from '../ui/button'
import { useForm } from 'react-hook-form'
import { GrNext, GrPrevious } from "react-icons/gr";
import Select from '../form/Select';
import { FaAngleDown } from 'react-icons/fa';
import { PrimaryTooltip } from '../common/PrimaryTooltip';


type PrimaryNavigationProps = {
    count: number,
    onChange: (pageIndex: number, pageSize: number) => void
}

const options = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
]
const PrimaryNavigation = ({ count, onChange }: PrimaryNavigationProps) => {

    const [pagination, setPagination] = React.useState<{ pageIndex: number; pageSize: number }>({
        pageIndex: 1,
        pageSize: 10,
    })

    const form = useForm()

    const pageCount = Math.ceil(count / pagination.pageSize)


    React.useEffect(() => {
        setPagination((prev) => ({
            ...prev,
            pageSize: Number(form.watch("pageSize")) || 10,
            pageIndex: 1,
        }))
    }, [form.watch("pageSize")])

    React.useEffect(() => {
        onChange(pagination.pageIndex, pagination.pageSize)
    }, [pagination])



    return (
        <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 max-w-full'>
                <Button
                    variant="outline"
                    disabled={pagination.pageIndex === 1}
                    onClick={() => setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex - 1
                    }))}
                >
                    <GrPrevious
                        className='text-2xl'
                    />
                </Button>
                <div className='w-full overflow-x-scroll flex gap-2 hidden-scroll-bar'>
                    {
                        Array(pageCount).fill("").map((_, index) => {
                            return (
                                <Button
                                    variant={pagination.pageIndex === index + 1 ? "default" : "outline"}
                                    key={index}
                                    className=''
                                    onClick={() => {
                                        setPagination((prev) => ({
                                            ...prev,
                                            pageIndex: index + 1
                                        }))
                                    }}
                                >
                                    {index + 1}
                                </Button>
                            )
                        })
                    }
                </div>
                <Button
                    aria-label='Next'
                    variant="outline"
                    disabled={pagination.pageIndex === pageCount}
                    onClick={() => setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex + 1
                    }))}
                >
                    <GrNext
                        className='text-2xl'
                    />
                </Button>
                <div className="relative min-w-20">
                    <Select
                        options={options}
                        placeholder={pagination.pageSize.toString()}
                        defaultValue={pagination.pageSize.toString()}
                        {...form.register("pageSize")}
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                        <FaAngleDown />
                    </span>
                </div>
                <PrimaryTooltip content="Tổng số liên hệ">
                    <div className='min-w-12 min-h-12 dark:bg-black border rounded-full h-full flex items-center justify-center font-bold'>
                        {count || 0}
                    </div>
                </PrimaryTooltip>

            </div>
        </div>
    )
}


export default PrimaryNavigation
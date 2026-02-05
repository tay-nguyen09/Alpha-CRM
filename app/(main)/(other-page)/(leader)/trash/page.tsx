"use client"
import ComponentCard from '@/components/common/ComponentCard'
import TrashTable from '@/components/tables/TrashTable'

const TrashPage = () => {
    return (
        <div className='space-y-6'>
            <ComponentCard title='Thùng rác' desc='Danh sách liên hệ đã xoá (có thể xoá vĩnh viễn)'>
                <TrashTable />
            </ComponentCard>
        </div>
    )
}

export default TrashPage

import ComponentCard from '@/components/common/ComponentCard'
import DailyTaskTable from '@/components/tables/DailyTaskTable'
import AddNewContact from '@/components/dialog/AddNewContact'

const DailyTask = () => {
    return (
        <div className='space-y-6'>
            <ComponentCard title="Báo Cáo Hằng Ngày" button={<AddNewContact />} desc="Quản lý báo cáo tương tác hằng ngày của sale">
                <DailyTaskTable />
            </ComponentCard>
        </div>
    )
}

export default DailyTask

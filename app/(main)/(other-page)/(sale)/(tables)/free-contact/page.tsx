import ComponentCard from '@/components/common/ComponentCard'
import FloatingContactTable from '@/components/tables/FloatingContactTable'

const Home = () => {
    return (
        <div>
            <div className="space-y-6">
                <ComponentCard title="Dữ Liệu Thả Nổi"
                    desc='Nhân Viên Có Thể Lấy Liên Hệ Từ Đây Khi Có Người Mới Đẩy Vào'
                >
                    <FloatingContactTable />
                </ComponentCard>
            </div>
        </div>
    )
}

export default Home
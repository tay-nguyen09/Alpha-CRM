import ComponentCard from "@/components/common/ComponentCard";
import AddNewContact from '@/components/dialog/AddNewContact';
import SecondTable from '@/components/tables/SecondTable';

const Home = () => {
    return (
        <div className="space-y-6">
            <ComponentCard title="Quản Lý Khách Hàng" button={<AddNewContact />}
                desc="Thêm, Sửa, Xóa và Quản Lý Thông Tin Khách Hàng"
            >
                <SecondTable />
            </ComponentCard>
        </div>
    );
}

export default Home
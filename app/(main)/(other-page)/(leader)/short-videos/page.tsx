"use client"
import ComponentCard from '@/components/common/ComponentCard'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import SourceImgAndVideo from '@/components/common/SourceImgAndVideo'
import PrimaryDialog from '@/components/dialog/PrimaryDialog'
import { Button } from '@/components/ui/button'
import { useRedux } from '@/hooks/useRedux'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const ShortVideos = () => {
    const router = useRouter();

    const { shortVideoPosts, isLoading, deleteShortVideoPost } = useRedux();
    return (
        <div className="p-4 space-y-4">
            <PageBreadcrumb pageTitle="Quản Lý Videos Ngắn" />

            <ComponentCard title="Danh Sách Videos Ngắn"
                button={
                    <Button onClick={() => router.push('/short-videos/create')}>
                        Tạo Video Ngắn Mới
                    </Button>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shortVideoPosts.length === 0 && !isLoading && (
                        <div className="text-gray-500">Không có dữ liệu</div>
                    )}
                    {shortVideoPosts.map(c => (
                        <ComponentCard key={c.id}
                        >
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <SourceImgAndVideo url={c.sourceUrl} />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="w-full text-xl font-semibold">{c.title || c.id}</div>
                                </div>
                            </div>
                            <div className="flex justify-between gap-2">
                                <PrimaryDialog
                                    buttonOpen={
                                        <Button variant="destructive">
                                            Xóa Bài Viết
                                        </Button>
                                    }
                                    onConfirm={() => {
                                        deleteShortVideoPost(c.id)
                                        toast.success("Xóa Bài Viết Thành Công")
                                    }}
                                >

                                    Bạn có chắc chắn muốn xóa bài viết này không?
                                </PrimaryDialog>
                                {/* <Button
                                    variant="outline"
                                    onClick={() => router.push(`/analytic-posts/${c.id}`)}
                                >
                                    Chỉnh sửa
                                </Button> */}

                            </div>
                        </ComponentCard>
                    ))}

                </div>

                {isLoading && <div className="text-gray-500">Đang tải...</div>}
            </ComponentCard>
        </div>
    )
}

export default ShortVideos
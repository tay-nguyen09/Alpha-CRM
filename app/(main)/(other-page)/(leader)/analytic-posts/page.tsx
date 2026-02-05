"use client"
import ComponentCard from '@/components/common/ComponentCard'
import PageBreadcrumb from '@/components/common/PageBreadCrumb'
import SourceImgAndVideo from '@/components/common/SourceImgAndVideo'
import PrimaryDialog from '@/components/dialog/PrimaryDialog'
import { Button } from '@/components/ui/button'
import { useRedux } from '@/hooks/useRedux'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const AnalyticPosts = () => {
    const router = useRouter();

    const { analyticPosts, isLoading, deleteAnalyticPost } = useRedux();

    return (
        <div className="p-4 space-y-4">
            <PageBreadcrumb pageTitle="Quản Lý Bài Phân Tích" />

            <ComponentCard title="Danh Sách Bài Phân Tích"
                button={
                    <Button onClick={() => router.push('/analytic-posts/create')}>
                        Tạo Bài Phân Tích Mới
                    </Button>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {analyticPosts.length === 0 && !isLoading && (
                        <div className="text-gray-500">Không có dữ liệu</div>
                    )}
                    {analyticPosts.map(c => (
                        <ComponentCard key={c.id}
                        >
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <SourceImgAndVideo url={c.sourceUrl} />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="w-full text-xl font-semibold">{c.title || c.id}</div>

                                    <div className=" mt-1">
                                        <pre className="font-medium text-wrap" >
                                            {c.content}
                                        </pre>
                                    </div>
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
                                        deleteAnalyticPost(c.id)
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

export default AnalyticPosts
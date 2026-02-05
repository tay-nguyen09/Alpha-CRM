"use client"
import ComponentCard from '@/components/common/ComponentCard'
import DropzoneComponent from '@/components/form/form-elements/DropZone'
import Input from '@/components/form/input/InputField'
import TextArea from '@/components/form/input/TextArea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRedux } from '@/hooks/useRedux'
import { TypeAnalyticPostForm } from '@/types/form'
import { useRouter } from 'next/navigation'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

const Page = () => {
    const form = useForm<TypeAnalyticPostForm>()
    const { addAnalyticPost } = useRedux()
    const router = useRouter();

    const onSubmit: SubmitHandler<TypeAnalyticPostForm> = async (data) => {
        try {
            const payload: TypeAnalyticPostForm = data
            addAnalyticPost(data)
            toast.success("Thành Công")
            form.reset()
            setTimeout(() => router.push('/analytic-posts'), 800);
        } catch (error) {
            toast.info("Lỗi, Vui Lòng Liên Hệ Dev !!")
            console.log(error)
        }
    }

    return (
        <ComponentCard>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-5 flex-col">
                <div className="flex gap-2 flex-col">
                    <Controller
                        control={form.control}
                        name="sourceUrl"
                        render={({ field }) => (
                            <DropzoneComponent
                                title="Tải lên hình ảnh hoặc video của bài đăng"
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>
                <div className="flex gap-2 flex-col">
                    <Label>
                        Tiêu đề
                    </Label>
                    <Input
                        placeholder="Nhập tiêu đề bài viết"
                        {...form.register('title')}
                    />
                </div>
                <div className="flex gap-2 flex-col">
                    <Label>
                        Nội dung bài viết
                    </Label>
                    <TextArea
                        className='h-[200px]'
                        placeholder="Nhập nội dung bài viết"
                        {...form.register('content')}
                    />
                </div>
                <div className="flex gap-2  justify-end">
                    <Button type="button" variant="outline" className='p-5 text-xl uppercase'
                        onClick={() => router.push('/analytic-posts')}
                    >Hủy</Button>
                    <Button type="submit" className='p-5 text-xl uppercase'>Tạo bài viết</Button>
                </div>
            </form>
        </ComponentCard>
    )
}

export default Page
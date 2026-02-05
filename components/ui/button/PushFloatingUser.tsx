import PrimaryDialog from '@/components/dialog/PrimaryDialog';
import Input from '@/components/form/input/InputField';
import { useUsers } from '@/hooks/useUsers';
import { useForm } from 'react-hook-form';
import { IoPush } from "react-icons/io5";
import { toast } from 'react-toastify';
import { DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';

type Props = {
    docId: string
}
const PushFloatingUser = ({ docId }: Props) => {
    const { updateUserByDocId } = useUsers()
    const onSubmit = async (data: { note: string }) => {
        try {
            updateUserByDocId({
                docId: docId, data: { isFloating: true }, action: {
                    note: data.note,
                    action: "push_floating_user"
                }
            })
            toast.success("Thành Công")
        } catch {
            toast.info("Lỗi, Vui Lòng Liên Hệ Dev !!")
        }
    }
    const { register, handleSubmit, formState: { errors } } = useForm<{ note: string }>();
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <PrimaryDialog
                onConfirm={handleSubmit(onSubmit)}
                buttonOpen={
                    <Button variant="outline">
                        <IoPush />
                    </Button>
                }
                disableConfirm={!!errors.note}
            >
                <DialogHeader>
                    <DialogTitle>Bạn có Muốn Đẩy Thông Tin Liên Hệ Này Tới Dữ Liệu Thả Nổi Hay Không</DialogTitle>
                    <Input
                        {...register("note", { required: "Lý Do là bắt buộc", minLength: { value: 4, message: "Lý do phải có ít nhất 4 ký tự" } })}
                        placeholder='Điền Lý Do Tại Đây !!'
                        name='note'
                    />
                    {errors.note && <span style={{ color: "red" }}>{errors.note.message}</span>}
                </DialogHeader>
            </PrimaryDialog>
        </form>
    )
}

export default PushFloatingUser
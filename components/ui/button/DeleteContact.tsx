import PrimaryDialog from '@/components/dialog/PrimaryDialog';
import Input from '@/components/form/input/InputField';
import {
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useUsers } from '@/hooks/useUsers';
import { useForm } from 'react-hook-form';
import { MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';
import { Button } from '../button';
type Props = {
    docId: string
}
const DeleteContact = ({ docId }: Props) => {

    const { updateUserByDocId } = useUsers()

    const onSubmit = async (data: { note: string }) => {
        try {
            updateUserByDocId({
                docId: docId, data: { isDelete: true }, action: {
                    note: data.note,
                    action: "delete_contact"
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
                        <MdDelete />
                    </Button>

                }
                disableConfirm={!!errors.note}
            >
                <DialogHeader>
                    <DialogTitle>Bạn có Muốn Xóa Thông Tin Liên Hệ Này Hay Không</DialogTitle>
                    <Input
                        {...register("note", { required: "Lý do là bắt buộc", minLength: { value: 4, message: "Lý do phải có ít nhất 4 ký tự" } })}
                        placeholder='Điền Lý Do Tại Đây !!'
                        name='note'
                    />
                    {errors.note && <span style={{ color: "red" }}>{errors.note.message}</span>}
                </DialogHeader>
            </PrimaryDialog>
        </form>
    )
}

export default DeleteContact
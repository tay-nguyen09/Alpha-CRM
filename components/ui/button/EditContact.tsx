import { MdModeEdit } from 'react-icons/md'
import {
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import EditContactForm from '@/components/form/EditContactForm'
import PrimaryDialog from '@/components/dialog/PrimaryDialog'
import { Button } from '../button'
type Props = {
    docId: string
}
const EditContact = ({ docId }: Props) => {
    return (
        <PrimaryDialog
            buttonOpen={
                <Button variant="outline">
                    <MdModeEdit />
                </Button>
            }
            isShowFooter={false}
        >
            <DialogHeader>
                <DialogTitle>Chỉnh sửa</DialogTitle>
            </DialogHeader>
            <div className='mt-5'>
                <EditContactForm docId={docId} />
            </div>
        </PrimaryDialog>

    )
}

export default EditContact
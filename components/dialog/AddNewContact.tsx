'use client'
import {
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { FaPlus } from 'react-icons/fa'
import NewContactForm from '../form/NewContactForm'
import PrimaryDialog from "./PrimaryDialog"
import { Button } from "../ui/button"

const AddNewContact = () => {
    return (

        <PrimaryDialog
            buttonOpen={
                <Button>
                    <FaPlus />  Thêm Khách Hàng
                </Button>
            }
            isShowFooter={false}
        >
            <DialogHeader>
                <DialogTitle>Thêm Thông Tin Liên Hệ</DialogTitle>
            </DialogHeader>
            <div className="mt-5">
                <NewContactForm />
            </div>
        </PrimaryDialog>

    )
}

export default AddNewContact
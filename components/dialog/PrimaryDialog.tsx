import {
    Dialog,
    DialogClose,
    DialogContent
} from "@/components/ui/dialog";
import React from 'react';
import { IoMdClose } from "react-icons/io";
import { Button } from "../ui/button";

type Props = {
    buttonOpen: string | React.ReactNode
    onClose?: () => void
    onConfirm?: () => void
    onOpen?: () => void
    closeOnConfirm?: boolean,
    children: React.ReactNode
    isShowFooter?: boolean,
    disableConfirm?: boolean
}

const PrimaryDialog = ({ buttonOpen, children, onClose, onConfirm, onOpen, closeOnConfirm = true, isShowFooter = true, disableConfirm = false }: Props) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const handleClose = () => {
        if (onClose) {
            onClose()
        }

        setIsOpen(false)
    }

    const handleOpen = () => {
        if (onOpen) {
            onOpen()
        }
        setIsOpen(true)
    }
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        }
        if (closeOnConfirm) {
            setIsOpen(false)
        }
    }
    return (
        <Dialog open={isOpen} >
            {typeof buttonOpen === 'string' ? (
                <Button variant="outline" size="sm" onClick={handleOpen}>
                    {buttonOpen}
                </Button>
            ) : React.isValidElement(buttonOpen) ? (
                (() => {
                    const element = buttonOpen as React.ReactElement;
                    const props = (typeof element.props === 'object' && element.props !== null) ? element.props as Record<string, unknown> : {};
                    const originalOnClick = typeof props.onClick === 'function' ? props.onClick as (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void : undefined;
                    const children = (props.children ?? null) as React.ReactNode;
                    return React.createElement(
                        element.type,
                        {
                            ...props,
                            onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                                if (originalOnClick) {
                                    originalOnClick(e);
                                }
                                handleOpen();
                            },
                            key: element.key
                        },
                        children
                    );
                })()
            ) : null}

            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={handleClose}
                onPointerDownOutside={handleClose}
                onInteractOutside={handleClose}
                className='max-h-[80vh] overflow-y-scroll hidden-scroll-bar'
            >
                <DialogClose className='flex justify-end'>
                    <IoMdClose onClick={handleClose} />
                </DialogClose>
                <div >
                    {children}
                </div>
                <div>
                    {isShowFooter &&
                        <div className='flex gap-2'>
                            <Button
                                className='flex-1'
                                variant='outline'
                                onClick={handleClose}
                            >
                                Huỷ Bỏ
                            </Button>
                            <Button className='flex-1' onClick={handleConfirm} disabled={disableConfirm}>
                                Xác Nhận
                            </Button>
                        </div>
                    }
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PrimaryDialog
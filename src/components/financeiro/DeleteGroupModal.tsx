'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X, Layers, UserMinus } from 'lucide-react';

interface DeleteGroupModalProps {
    open: boolean;
    onClose: () => void;
    onConfirmSingle: () => void;
    onConfirmSeries: () => void;
    title: string;
    description: string;
    isParcela?: boolean;
}

export function DeleteGroupModal({
    open,
    onClose,
    onConfirmSingle,
    onConfirmSeries,
    title,
    description,
    isParcela = false,
}: DeleteGroupModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-zinc-900 border-zinc-800 rounded-2xl">
                <DialogHeader>
                    <div className="flex items-start gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shrink-0">
                            <Trash2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl text-white mb-2">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <Button
                        variant="outline"
                        onClick={onConfirmSingle}
                        className="flex flex-col items-center justify-center h-24 gap-2 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all group"
                    >
                        <UserMinus className="w-6 h-6 text-zinc-500 group-hover:text-zinc-300" />
                        <div className="text-center">
                            <span className="block font-semibold">Apenas esta</span>
                            <span className="text-[10px] opacity-50">Excluir registro selecionado</span>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={onConfirmSeries}
                        className="flex flex-col items-center justify-center h-24 gap-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all group"
                    >
                        <Layers className="w-6 h-6 text-red-500/60 group-hover:text-red-500" />
                        <div className="text-center">
                            <span className="block font-semibold">Esta e as próximas</span>
                            <span className="text-[10px] opacity-50">Excluir série completa</span>
                        </div>
                    </Button>
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-300"
                    >
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

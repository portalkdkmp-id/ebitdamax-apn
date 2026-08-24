import { useState } from 'react';
import { Clock3, Ellipsis, Paperclip, Send, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function ChatbotComingSoon() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed right-4 bottom-7 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-8">
            {isOpen && (
                <section
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby="chatbot-title"
                    className="flex h-[min(640px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-[2rem] border bg-card shadow-2xl"
                >
                    <header className="flex items-center gap-3 border-b px-5 py-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full border bg-primary/5 p-1 shadow-sm">
                            <img
                                src="/maskot-kdkmp.png"
                                alt="Maskot KDKMP"
                                className="size-full object-contain"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2
                                id="chatbot-title"
                                className="truncate font-semibold text-foreground"
                            >
                                Asisten KDKMP
                            </h2>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Sparkles className="size-3 text-primary" />
                                Fitur sedang dipersiapkan
                            </p>
                        </div>

                        <Ellipsis
                            aria-hidden="true"
                            className="size-5 shrink-0 text-muted-foreground"
                        />
                        <button
                            type="button"
                            aria-label="Tutup chatbot"
                            onClick={() => setIsOpen(false)}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <X className="size-5" />
                        </button>
                    </header>

                    <div className="flex flex-1 flex-col p-5">
                        <div className="max-w-[340px] rounded-[1.5rem] bg-muted/60 p-5">
                            <Badge
                                variant="outline"
                                className="mb-3 border-primary/25 bg-background/80 text-primary"
                            >
                                <Clock3 className="size-3.5" />
                                Coming Soon
                            </Badge>
                            <p className="text-lg leading-relaxed font-medium text-foreground">
                                Halo, Sobat KDKMP! 👋
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                Asisten KDKMP sedang dipersiapkan untuk membantu
                                Anda mendapatkan informasi seputar koperasi dan
                                operasional KDKMP.
                            </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="size-2 rounded-full bg-primary/70" />
                            Nantikan fitur chat pintar kami.
                        </div>

                        <div className="mt-auto pt-6">
                            <div className="rounded-[1.25rem] border bg-muted/20 p-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Paperclip
                                        aria-hidden="true"
                                        className="size-5 shrink-0 text-muted-foreground/50"
                                    />
                                    <Input
                                        disabled
                                        placeholder="Chat akan segera hadir..."
                                        className="h-10 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                                    />
                                    <button
                                        type="button"
                                        disabled
                                        aria-label="Kirim pesan belum tersedia"
                                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/50"
                                    >
                                        <Send className="size-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground/65">
                                <Sparkles
                                    aria-hidden="true"
                                    className="size-3.5 text-primary/65"
                                />
                                Powered by PT Agrinas Pangan Nusantara
                            </p>
                        </div>
                    </div>
                </section>
            )}

            <button
                type="button"
                aria-label="Buka Asisten KDKMP"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="flex size-24 items-center justify-center transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
                <img
                    src="/maskot-kdkmp.png"
                    alt=""
                    className="size-full object-contain drop-shadow-lg"
                />
            </button>
        </div>
    );
}

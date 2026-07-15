"use client";

import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  AudioLines,
  FolderOpen,
  X,
  FileAudio,
  Upload,
  Mic,
  Tag,
  Play,
  Pause,
  Check,
  ChevronsUpDown,
  Globe,
  Layers,
  AlignLeft,
  Wand2,
  Loader2,
} from "lucide-react";
import locales from "locale-codes";

import { cn, formatFileSize } from "@/lib/utils";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useTRPC } from "@/trpc/client";
import {
  extractAudioFromVideo,
  cropAudioBuffer,
} from "@/lib/client-audio-utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  VOICE_CATEGORIES,
  VOICE_CATEGORY_LABELS,
} from "@/features/voices/data/voice-categories";
import { VoiceRecorder } from "./voice-recorder";
import { AudioTrimmer } from "./audio-trimmer";

const LANGUAGE_OPTIONS = (locales as any).all
  .filter((l: any) => l.tag && l.tag.includes("-") && l.name)
  .map((l: any) => ({
    value: l.tag,
    label: l.location ? `${l.name} (${l.location})` : l.name,
  }));

const voiceCreateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  file: z
    .instanceof(File, { message: "An audio file is required" })
    .nullable()
    .refine((f) => f !== null, "An audio file is required"),
  category: z.string().min(1, "A category is required"),
  language: z.string().min(1, "A language is required"),
  description: z.string(),
});

function FileDropzone({
  file,
  onFileChange,
  isInvalid,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  isInvalid?: boolean;
}) {
  const { isPlaying, togglePlay } = useAudioPlayback(file);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: { "audio/*": [], "video/*": [] },
      maxSize: 20 * 1024 * 1024,
      multiple: false,
      onDrop: (acceptedFiles: any) => {
        if (acceptedFiles.length > 0) {
          onFileChange(acceptedFiles[0]);
        }
      },
    });

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-background via-background to-muted/30 p-4 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gradient-from)]/10 to-[var(--gradient-via)]/10">
          <FileAudio className="size-5 text-[var(--gradient-from)]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={togglePlay}
          className="rounded-full transition-all hover:bg-[var(--gradient-from)]/10 hover:text-[var(--gradient-from)]"
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onFileChange(null)}
          className="rounded-full transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-500",
        isDragReject || isInvalid
          ? "border-destructive/70 bg-destructive/5"
          : isDragActive
            ? "border-[var(--gradient-from)]/70 bg-[var(--gradient-from)]/5"
            : "border-border/40 bg-gradient-to-b from-muted/20 to-transparent hover:border-[var(--gradient-from)]/30 hover:bg-[var(--gradient-from)]/5",
      )}
    >
      <div className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-[var(--gradient-from)]/10 via-[var(--gradient-via)]/10 to-[var(--gradient-from)]/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <input {...getInputProps()} />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gradient-from)]/15 to-[var(--gradient-via)]/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
        <AudioLines className="size-6 text-[var(--gradient-from)] transition-transform duration-300 group-hover:scale-110" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-semibold tracking-tight">
          Upload audio or video file
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Audio & video files supported, max size 20MB. Video audio is extracted
          automatically.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative transition-all group-hover:border-[var(--gradient-from)]/30 group-hover:bg-[var(--gradient-from)]/5 group-hover:shadow-sm"
      >
        <FolderOpen className="size-3.5" />
        Browse files
      </Button>
    </div>
  );
}

function LanguageCombobox({
  value,
  onChange,
  isInvalid,
}: {
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    LANGUAGE_OPTIONS.find((l: any) => l.value === value)?.label ?? "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={isInvalid}
          className={cn(
            "h-9 w-full justify-between font-normal transition-all duration-300",
            "focus-visible:border-[var(--gradient-from)]/40 focus-visible:shadow-[0_0_0_3px_var(--gradient-from)/10]",
            !value && "text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="size-4 shrink-0 transition-colors duration-300 group-focus-within:text-[var(--gradient-from)]" />
            {value ? selectedLabel : "Select language..."}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {LANGUAGE_OPTIONS.map((lang: any) => (
                <CommandItem
                  key={lang.value}
                  value={lang.label}
                  onSelect={() => {
                    onChange(lang.value);
                    setOpen(false);
                  }}
                >
                  {lang.label}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      value === lang.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface VoiceCreateFormProps {
  scrollable?: boolean;
  footer?: (submit: React.ReactNode) => React.ReactNode;
  onError?: (message: string) => void;
}

export function VoiceCreateForm({
  scrollable,
  footer,
  onError,
}: VoiceCreateFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [cropStart, setCropStart] = useState(0);
  const [cropEnd, setCropEnd] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const currentFileToken = useRef<string | null>(null);

  const processAudioFile = useCallback(async (file: File) => {
    const token = `${file.name}-${file.size}-${file.lastModified}`;
    currentFileToken.current = token;
    setIsExtracting(true);
    setAudioFile(null);
    try {
      const extracted = file.type.startsWith("video/")
        ? await extractAudioFromVideo(file)
        : file;
      if (currentFileToken.current !== token) return;
      setAudioFile(extracted);
    } catch (err) {
      if (currentFileToken.current !== token) return;
      const message =
        err instanceof Error ? err.message : "Failed to extract audio";
      toast.error(message);
    } finally {
      if (currentFileToken.current === token) {
        setIsExtracting(false);
      }
    }
  }, []);

  const createMutation = useMutation({
    mutationFn: async ({
      name,
      category,
      language,
      description,
    }: {
      name: string;
      category: string;
      language: string;
      description?: string;
    }) => {
      let uploadFile = audioFile;
      if (!uploadFile) throw new Error("No audio file available");

      // Always convert to WAV — the chatterbox API requires WAV format
      // cropAudioBuffer decodes any format (webm, mp3, etc.) and re-encodes to WAV
      const effectiveEnd = cropEnd > 0 ? cropEnd : audioDuration;
      if (effectiveEnd > 0) {
        uploadFile = await cropAudioBuffer(uploadFile, cropStart, effectiveEnd);
      } else {
        // Fallback: convert the full file to WAV without knowing duration
        const buf = await uploadFile.arrayBuffer();
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(buf);
        await ctx.close();
        uploadFile = await cropAudioBuffer(uploadFile, 0, audioBuffer.duration);
      }

      const params = new URLSearchParams({
        name,
        category,
        language,
      });
      if (description) {
        params.set("description", description);
      }

      const response = await fetch(
        `/api/voices/create?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": uploadFile.type },
          body: uploadFile,
        },
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Failed to create voice");
      }

      return response.json();
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      file: null as File | null,
      category: "GENERAL" as string,
      language: "en-US",
      description: "",
    },
    validators: {
      onSubmit: voiceCreateFormSchema,
    },
    onSubmit: async ({ value }: any) => {
      try {
        await createMutation.mutateAsync({
          name: value.name,
          category: value.category,
          language: value.language,
          description: value.description || undefined,
        });

        toast.success("Voice created successfully!");
        queryClient.invalidateQueries({
          queryKey: trpc.voices.getAll.queryKey(),
        });
        form.reset();
        setAudioFile(null);
        setIsExtracting(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create voice";

        if (onError) {
          onError(message);
        } else {
          toast.error(message);
        }
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className={cn("flex flex-col", scrollable ? "min-h-0 flex-1" : "gap-6")}
    >
      <div
        className={cn(
          "flex flex-col",
          scrollable ? "min-h-0 flex-1 gap-4 overflow-y-auto px-6" : "gap-6",
        )}
      >
        <form.Field name="file">
          {(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            const handleFileChange = (file: File | null) => {
              field.handleChange(file);
              if (file) {
                processAudioFile(file);
              } else {
                setAudioFile(null);
              }
            };

            return (
              <Field data-invalid={isInvalid}>
                <Tabs defaultValue="upload">
                  <TabsList className="h-11! w-full bg-gradient-to-r from-muted/50 to-muted/30 p-0.5">
                    <TabsTrigger
                      value="upload"
                      className="data-[state=active]:shadow-sm data-[state=active]:shadow-[var(--gradient-from)]/10"
                    >
                      <Upload className="size-3.5" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger
                      value="record"
                      className="data-[state=active]:shadow-sm data-[state=active]:shadow-[var(--gradient-from)]/10"
                    >
                      <Mic className="size-3.5" />
                      Record
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload">
                    {isExtracting ? (
                      <div className="flex items-center justify-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-background via-background to-muted/30 p-8 shadow-sm">
                        <Loader2 className="size-5 animate-spin text-[var(--gradient-from)]" />
                        <span className="text-sm text-muted-foreground">
                          Extracting audio from video...
                        </span>
                      </div>
                    ) : (
                      <FileDropzone
                        file={field.state.value}
                        onFileChange={handleFileChange}
                        isInvalid={isInvalid}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="record">
                    <VoiceRecorder
                      file={field.state.value}
                      onFileChange={handleFileChange}
                      isInvalid={isInvalid}
                    />
                  </TabsContent>
                </Tabs>

                {audioFile && field.state.value && (
                  <div className="mt-3 space-y-2">
                    <AudioTrimmer
                      file={audioFile}
                      onCropChange={(start, end) => {
                        setCropStart(start);
                        setCropEnd(end);
                      }}
                      onReady={(duration) => setAudioDuration(duration)}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAudioFile(null);
                          setCropStart(0);
                          setCropEnd(0);
                          setAudioDuration(0);
                          field.handleChange(null);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="name">
          {(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <div className="group relative flex items-center transition-all duration-300 focus-within:scale-[1.01]">
                  <div className="pointer-events-none absolute left-0 z-10 flex h-full w-11 items-center justify-center transition-colors duration-300 group-focus-within:text-[var(--gradient-from)]">
                    <Tag className="size-4" />
                  </div>
                  <Input
                    id={field.name}
                    placeholder="Voice Label"
                    aria-invalid={isInvalid}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="pl-10 transition-all duration-300 focus-visible:border-[var(--gradient-from)]/40 focus-visible:shadow-[0_0_0_3px_var(--gradient-from)/10]"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 ring-1 ring-[var(--gradient-from)]/20 transition-opacity duration-300 group-focus-within:opacity-100" />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="category">
          {(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <div className="group relative flex items-center transition-all duration-300 focus-within:scale-[1.01]">
                  <div className="pointer-events-none absolute left-0 z-10 flex h-full w-11 items-center justify-center transition-colors duration-300 group-focus-within:text-[var(--gradient-from)]">
                    <Layers className="size-4" />
                  </div>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger className="w-full pl-10 transition-all duration-300 focus:border-[var(--gradient-from)]/40 focus:ring-[var(--gradient-from)]/20">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {VOICE_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="language">
          {(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <div className="group transition-all duration-300 focus-within:scale-[1.01]">
                  <LanguageCombobox
                    value={field.state.value}
                    onChange={field.handleChange}
                    isInvalid={isInvalid}
                  />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field: any) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <div className="group relative flex items-start transition-all duration-300 focus-within:scale-[1.005]">
                  <div className="pointer-events-none absolute left-0 top-0 z-10 flex h-11 w-11 items-center justify-center transition-colors duration-300 group-focus-within:text-[var(--gradient-from)]">
                    <AlignLeft className="size-4" />
                  </div>
                  <Textarea
                    id={field.name}
                    placeholder="Describe this voice..."
                    aria-invalid={isInvalid}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="min-h-20 pl-10 transition-all duration-300 focus-visible:border-[var(--gradient-from)]/40 focus-visible:shadow-[0_0_0_3px_var(--gradient-from)/10]"
                    rows={3}
                  />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </div>

      <form.Subscribe
        selector={(s: any) => ({
          isSubmitting: s.isSubmitting,
        })}
      >
        {({ isSubmitting }: any) => {
          const submitButton = (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="relative overflow-hidden bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-via)] text-white shadow-lg shadow-[var(--gradient-from)]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--gradient-from)]/30 disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-3 w-0.5 animate-waveform rounded-full bg-white/80"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" />
                    Create Voice
                  </>
                )}
              </span>
            </Button>
          );

          return footer ? (
            <div
              className={cn(
                scrollable && "border-t border-border/30 px-6 pt-4 pb-6",
              )}
            >
              {footer(submitButton)}
            </div>
          ) : (
            <div
              className={cn(
                scrollable && "border-t border-border/30 px-6 pt-4 pb-6",
              )}
            >
              {submitButton}
            </div>
          );
        }}
      </form.Subscribe>
    </form>
  );
}

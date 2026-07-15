/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "lucide-react" {
  import type { ComponentType, SVGProps, ForwardRefExoticComponent, Ref } from "react";
  type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; ref?: Ref<SVGSVGElement> };
  type Icon = ForwardRefExoticComponent<IconProps>;
  export type LucideIcon = Icon;
  export const AlertTriangle: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const AudioLines: Icon;
  export const AudioWaveform: Icon;
  export const AlignLeft: Icon;
  export const Ban: Icon;
  export const Bell: Icon;
  export const BellOff: Icon;
  export const BookOpen: Icon;
  export const Brain: Icon;
  export const Building2: Icon;
  export const Check: Icon;
  export const CheckCircle: Icon;
  export const CheckIcon: Icon;
  export const ChevronDown: Icon;
  export const ChevronDownIcon: Icon;
  export const ChevronLeftIcon: Icon;
  export const ChevronRight: Icon;
  export const ChevronRightIcon: Icon;
  export const ChevronUpIcon: Icon;
  export const ChevronsUpDown: Icon;
  export const CircleIcon: Icon;
  export const CircleCheckIcon: Icon;
  export const Clock: Icon;
  export const Coins: Icon;
  export const Clapperboard: Icon;
  export const CreditCard: Icon;
  export const Download: Icon;
  export const Eye: Icon;
  export const FileAudio: Icon;
  export const FileText: Icon;
  export const FolderOpen: Icon;
  export const Gamepad2: Icon;
  export const Globe: Icon;
  export const GripVerticalIcon: Icon;
  export const Headphones: Icon;
  export const History: Icon;
  export const Home: Icon;
  export const InfoIcon: Icon;
  export const Languages: Icon;
  export const LayoutGrid: Icon;
  export const Layers: Icon;
  export const Loader2: Icon;
  export const Loader2Icon: Icon;
  export const Mic: Icon;
  export const MicOff: Icon;
  export const MinusIcon: Icon;
  export const MoreHorizontal: Icon;
  export const MoreHorizontalIcon: Icon;
  export const OctagonXIcon: Icon;
  export const Palette: Icon;
  export const PanelLeftIcon: Icon;
  export const Pause: Icon;
  export const Play: Icon;
  export const Podcast: Icon;
  export const PodcastIcon: Icon;
  export const Redo: Icon;
  export const RotateCcw: Icon;
  export const Scissors: Icon;
  export const Search: Icon;
  export const SearchIcon: Icon;
  export const Settings: Icon;
  export const ShieldAlert: Icon;
  export const SkipBack: Icon;
  export const SkipForward: Icon;
  export const Smile: Icon;
  export const Sparkles: Icon;
  export const Square: Icon;
  export const Tag: Icon;
  export const ThumbsUp: Icon;
  export const TriangleAlertIcon: Icon;
  export const Trash2: Icon;
  export const TrendingUp: Icon;
  export const Tooltip: Icon;
  export const Undo: Icon;
  export const Upload: Icon;
  export const Volume2: Icon;
  export const Wand2: Icon;
  export const Waves: Icon;
  export const X: Icon;
  export const XCircle: Icon;
  export const XIcon: Icon;
}

declare module "@tanstack/react-query" {
  export function useQuery(...args: any[]): any;
  export function useSuspenseQuery(...args: any[]): any;
  export function useMutation(...args: any[]): any;
  export function useSuspenseQueries(...args: any[]): any;
  export function useQueryClient(...args: any[]): any;
  export function HydrationBoundary(props: any): any;
  export function QueryClientProvider(props: any): any;
  export class QueryClient {
    constructor(config?: any);
    prefetchQuery(...args: any[]): any;
    prefetchInfiniteQuery(...args: any[]): any;
    [key: string]: any;
  }
  export function dehydrate(client: any, options?: any): any;
  export function defaultShouldDehydrateQuery(...args: any[]): boolean;
}

declare module "@tanstack/react-form" {
  export function useForm(...args: any[]): any;
  export function formOptions(...args: any[]): any;
  export function createFormHook(...args: any[]): any;
  export function createFormHookContexts(...args: any[]): any;
  export function useStore(...args: any[]): any;
}

declare module "@trpc/server" {
  export const initTRPC: any;
  export class TRPCError extends Error {
    constructor(opts: { code: string; message?: string; cause?: unknown });
  }
  export type inferRouterOutputs<T = any> = any;
}

declare module "@trpc/client" {
  export function createTRPCClient<TRouter = any>(...args: any[]): any;
  export function httpBatchLink(...args: any[]): any;
}

declare module "@trpc/tanstack-react-query" {
  export function createTRPCOptionsProxy(...args: any[]): any;
  export function createTRPCContext<TRouter = any>(...args: any[]): any;
  export type TRPCQueryOptions = (...args: any[]) => any;
}

declare module "@trpc/server/adapters/fetch" {
  export function fetchRequestHandler(...args: any[]): any;
}

declare module "superjson" {
  const superjson: any;
  export default superjson;
}

declare module "nuqs" {
  export function useQueryState(...args: any[]): any;
}

declare module "nuqs/server" {
  export type SearchParams = Record<string, string | string[] | undefined>;
  export function createSearchParamsCache(...args: any[]): any;
  export const parseAsString: {
    withDefault(value: string): any;
    [key: string]: any;
  };
}

declare module "use-debounce" {
  export function useDebouncedCallback(...args: any[]): any;
}

declare module "react-error-boundary" {
  export function ErrorBoundary(props: any): any;
}

declare module "react-dropzone" {
  export function useDropzone(...args: any[]): any;
}

declare module "wavesurfer.js" {
  class WaveSurfer {
    static create(...args: any[]): WaveSurfer;
    constructor(...args: any[]);
    on(...args: any[]): any;
    load(...args: any[]): any;
    loadBlob(...args: any[]): void;
    play(): void;
    pause(): void;
    stop(): void;
    getCurrentTime(): number;
    getDuration(): number;
    setTime(...args: any[]): void;
    getBlob(): Blob;
    destroy(): void;
    [key: string]: any;
  }
  export default WaveSurfer;
}

declare module "wavesurfer.js/dist/plugins/record.esm.js" {
  class RecordPlugin {
    static create(...args: any[]): RecordPlugin;
    constructor(...args: any[]);
    on(...args: any[]): any;
    startRecording(): void;
    stopRecording(): void;
    getBlob(): Blob;
    destroy(): void;
    [key: string]: any;
  }
  export default RecordPlugin;
}

declare module "recordrtc" {
  class StereoAudioRecorder {
    constructor(...args: any[]);
    [key: string]: any;
  }
  interface RecordRTCVoidHandler {
    startRecording(): void;
    stopRecording(callback?: () => void): void;
    pauseRecording(): void;
    resumeRecording(): void;
    getBlob(): Blob;
    destroy(): void;
    getState(): string;
    StereoAudioRecorder: typeof StereoAudioRecorder;
    [key: string]: any;
  }
  interface RecordRTCStatic {
    (stream: any, options?: any): RecordRTCVoidHandler;
    new (stream: any, options?: any): RecordRTCVoidHandler;
    StereoAudioRecorder: typeof StereoAudioRecorder;
    [key: string]: any;
  }
  const RecordRTC: RecordRTCStatic;
  export default RecordRTCVoidHandler;
  export { StereoAudioRecorder, RecordRTC, RecordRTCVoidHandler };
}

declare module "music-metadata" {
  export function parseBuffer(...args: any[]): Promise<any>;
  export function parseFile(...args: any[]): Promise<any>;
}

declare module "simplex-noise" {
  export function createNoise3D(...args: any[]): (...args: number[]) => number;
}

declare module "pino" {
  interface Logger {
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    trace(...args: any[]): void;
    fatal(...args: any[]): void;
    child(...args: any[]): Logger;
    [key: string]: any;
  }
  interface Pino {
    (options?: any): Logger;
    stdSerializers: {
      req: any;
      res: any;
      err: any;
    };
    [key: string]: any;
  }
  const pino: Pino;
  export default pino;
}

declare module "openapi-fetch" {
  function createClient<Paths = any>(...args: any[]): any;
  export default createClient;
}

declare module "openapi-typescript" {
  export default function(...args: any[]): any;
  export function astToString(...args: any[]): string;
}

declare module "locale-codes" {
  interface Locale {
    name: string;
    locale: string;
    tag: string;
    location: string;
    [key: string]: string;
  }
  interface LocaleArray extends Array<Locale> {
    all: Locale[];
  }
  const locales: LocaleArray;
  export default locales;
}

declare module "web-push" {
  interface WebPush {
    setVapidDetails(email: string, publicKey: string, privateKey: string): void;
    sendNotification(pushSubscription: any, payload?: string | Buffer, options?: any): Promise<any>;
    generateVAPIDKeys(): { publicKey: string; privateKey: string };
    [key: string]: any;
  }
  const webpush: WebPush;
  export default webpush;
  export type WebPushNotification = any;
  export type WebPushSubscription = any;
  export type PushSubscription = any;
}

declare module "@base-ui/react" {
  export namespace ComboboxPrimitive {
    export function Root(props: any): any;
    export namespace Root { export type Props = any; }
    export function Value(props: any): any;
    export namespace Value { export type Props = any; }
    export function Trigger(props: any): any;
    export namespace Trigger { export type Props = any; }
    export function Clear(props: any): any;
    export namespace Clear { export type Props = any; }
    export function Input(props: any): any;
    export namespace Input { export type Props = any; }
    export function Popup(props: any): any;
    export namespace Popup { export type Props = any; }
    export function Positioner(props: any): any;
    export namespace Positioner { export type Props = any; }
    export function Portal(props: any): any;
    export namespace Portal { export type Props = any; }
    export function List(props: any): any;
    export namespace List { export type Props = any; }
    export function Item(props: any): any;
    export namespace Item { export type Props = any; }
    export function ItemIndicator(props: any): any;
    export namespace ItemIndicator { export type Props = any; }
    export function Group(props: any): any;
    export namespace Group { export type Props = any; }
    export function GroupLabel(props: any): any;
    export namespace GroupLabel { export type Props = any; }
    export function Collection(props: any): any;
    export namespace Collection { export type Props = any; }
    export function Separator(props: any): any;
    export namespace Separator { export type Props = any; }
    export function Options(props: any): any;
    export namespace Options { export type Props = any; }
    export function Option(props: any): any;
    export namespace Option { export type Props = any; }
    export function Empty(props: any): any;
    export namespace Empty { export type Props = any; }
    export function Chips(props: any): any;
    export namespace Chips { export type Props = any; }
    export function Chip(props: any): any;
    export namespace Chip { export type Props = any; }
    export function ChipRemove(props: any): any;
    export namespace ChipRemove { export type Props = any; }
  }
  export { ComboboxPrimitive as Combobox };
}

declare module "@dicebear/core" {
  export function createAvatar(...args: any[]): {
    toDataUri(): string;
    [key: string]: any;
  };
}

declare module "@dicebear/collection" {
  export const glass: any;
}

declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config?: any);
    send(command: any): Promise<any>;
  }
  export class PutObjectCommand {
    constructor(input: any);
  }
  export class GetObjectCommand {
    constructor(input: any);
  }
  export class DeleteObjectCommand {
    constructor(input: any);
  }
  export type PutObjectCommandInput = any;
}

declare module "@aws-sdk/s3-request-presigner" {
  export function getSignedUrl(client: any, command: any, options?: any): Promise<string>;
}

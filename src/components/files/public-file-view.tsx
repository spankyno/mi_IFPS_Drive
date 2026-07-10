import Link from "next/link";
import { HardDrive } from "lucide-react";
import { PublicMediaPreview } from "@/components/files/public-media-preview";

export function PublicFileView({
  name,
  mimeType,
  sizeBytes,
  createdAt,
  cid,
  gatewayUrl,
  allowDownload,
  isEncrypted,
  encryptionKey,
  encryptionIv,
}: {
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  cid: string;
  gatewayUrl: string;
  allowDownload: boolean;
  isEncrypted: boolean;
  encryptionKey: string | null;
  encryptionIv: string | null;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-2 border-b p-4 font-semibold">
        <Link href="/" className="flex items-center gap-2">
          <HardDrive className="size-5 text-primary" />
          mi_IPFS_Drive
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4 rounded-xl border p-6">
          <PublicMediaPreview
            name={name}
            mimeType={mimeType}
            sizeBytes={sizeBytes}
            createdAt={createdAt}
            cid={cid}
            gatewayUrl={gatewayUrl}
            allowDownload={allowDownload}
            isEncrypted={isEncrypted}
            encryptionKey={encryptionKey}
            encryptionIv={encryptionIv}
          />
        </div>
      </main>
    </div>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  QrCode,
  School,
  Users,
  GraduationCap,
  Link2,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

export type ProjectData = {
  id: string | number;
  header?: string | null;
  description?: string | null;
  method?: string | null;
  passMark?: number | string | null;
  created_at?: string | null;
  deleted?: string | null;
  school_data?: {
    school_name?: string | null;
    logo_image?: string | null;
  } | null;
  students?: unknown[] | null;
};

const SHARE_BASE_URL =
  "https://easeway-chi.vercel.app/home/share";

function getProjectShareUrl(projectId: string | number) {
  return `${SHARE_BASE_URL}/${encodeURIComponent(String(projectId))}`;
}

async function copyToClipboard(value: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.select();

  const successful = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Unable to copy the link.");
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load QR image."));

    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to create the poster image."));
      }
    }, "image/png");
  });
}

export default function QRCodePage({
  project,
  onBack,
}: {
  project: ProjectData;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shareUrl = getProjectShareUrl(project.id);

  const studentCount = Array.isArray(project.students)
    ? project.students.length
    : 0;

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }

      if (downloadTimer.current) {
        clearTimeout(downloadTimer.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await copyToClipboard(shareUrl);

      setCopied(true);
      setCopyError("");

      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }

      copyTimer.current = setTimeout(() => {
        setCopied(false);
        copyTimer.current = null;
      }, 2500);
    } catch (error) {
      console.error("Copy link error:", error);

      setCopied(false);
      setCopyError("Unable to copy the link. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);
    setDownloadError("");

    let qrObjectUrl: string | null = null;
    let posterObjectUrl: string | null = null;

    try {
      // Find the QR element.
      // getElementById returns HTMLElement, so verify its actual type.
      const qrElement = document.getElementById(
        `project-qr-${project.id}`
      );

      if (!(qrElement instanceof SVGSVGElement)) {
        throw new Error("The QR code could not be found.");
      }

      // Clone the verified SVG element.
      const clonedElement = qrElement.cloneNode(true);

      // Verify the cloned element before using SVG methods.
      if (!(clonedElement instanceof SVGSVGElement)) {
        throw new Error("Unable to prepare the QR code.");
      }

      const svgClone = clonedElement;

      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgClone.setAttribute("width", "620");
      svgClone.setAttribute("height", "620");

      const svgString = new XMLSerializer().serializeToString(svgClone);

      const qrBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });

      qrObjectUrl = URL.createObjectURL(qrBlob);

      const qrImage = await loadImage(qrObjectUrl);

      // A4-style portrait poster.
      const canvas = document.createElement("canvas");

      canvas.width = 794;
      canvas.height = 1123;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to create the poster.");
      }

      // Plain white paper.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Heading at the top.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#172554";
      ctx.font = "bold 38px Arial, sans-serif";

      ctx.fillText("SCAN TO DOWNLOAD", 397, 125);
      ctx.fillText("REPORT CARD", 397, 180);

      // Large QR code centered on the page.
      const qrSize = 620;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 300;

      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      const posterBlob = await canvasToBlob(canvas);

      posterObjectUrl = URL.createObjectURL(posterBlob);

      const link = document.createElement("a");

      link.href = posterObjectUrl;
      link.download = `easeway-report-card-qr-${project.id}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const urlToRevoke = posterObjectUrl;

      posterObjectUrl = null;

      downloadTimer.current = setTimeout(() => {
        URL.revokeObjectURL(urlToRevoke);
        downloadTimer.current = null;
      }, 3000);
    } catch (error) {
      console.error("QR poster download failed:", error);

      setDownloadError(
        error instanceof Error
          ? error.message
          : "Unable to download the QR poster. Please try again."
      );
    } finally {
      if (qrObjectUrl) {
        URL.revokeObjectURL(qrObjectUrl);
      }

      if (posterObjectUrl) {
        URL.revokeObjectURL(posterObjectUrl);
      }

      setDownloading(false);
    }
  };

  return (
    <div className="w-full space-y-7">
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 w-fit text-sm font-semibold text-gray-500 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <span className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
            <ArrowLeft size={17} />
          </span>
          Back to project selection
        </button>

        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-3">
            <QrCode size={14} />
            PROJECT QR GENERATOR
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Share your project
          </h1>

          <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            Anyone with this QR code or sharing link can open your
            project&apos;s sharing page.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 items-stretch">
        {/* QR CODE PREVIEW */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[430px]">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-blue-400/10 pointer-events-none" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-100 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-6">
              <QrCode size={14} />
              Ready to scan
            </div>

            <div className="mx-auto w-fit bg-white rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/20">
              <QRCodeSVG
                id={`project-qr-${project.id}`}
                value={shareUrl}
                size={280}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#111827"
              />
            </div>

            <h2 className="text-white text-lg font-bold mt-6">
              Scan to open project
            </h2>

            <p className="text-sm text-blue-100/80 mt-2 max-w-xs mx-auto leading-relaxed">
              Open your phone camera and point it at this QR code.
            </p>
          </div>
        </div>

        {/* PROJECT INFORMATION */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 flex flex-col">
          <div className="flex items-start gap-4">
            {project.school_data?.logo_image ? (
              <img
                src={project.school_data.logo_image}
                alt="School logo"
                className="w-14 h-14 rounded-2xl object-cover border border-gray-200 bg-gray-50 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <School size={25} className="text-blue-600" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Selected project
              </p>

              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1 break-words">
                {project.header || "Untitled Project"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {project.school_data?.school_name || "School not specified"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-7">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={16} />
                <span className="text-xs font-medium">Students</span>
              </div>

              <p className="text-xl font-bold text-gray-900 mt-2">
                {studentCount}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <GraduationCap size={17} />
                <span className="text-xs font-medium">Method</span>
              </div>

              <p className="text-base font-bold text-gray-900 mt-2">
                {project.method || "Unknown"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 my-7" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={17} className="text-blue-600" />

              <h3 className="text-sm font-bold text-gray-900">
                Project sharing link
              </h3>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Copy this link and share it with anyone who needs to access
              this project.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.target.select()}
                  aria-label="Project sharing link"
                  className="w-full min-w-0 py-3 bg-transparent outline-none text-xs text-gray-600"
                />
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy link
                  </>
                )}
              </button>
            </div>

            {copyError && (
              <p role="alert" className="text-xs text-red-600 mt-2">
                {copyError}
              </p>
            )}
          </div>

          <div className="mt-auto pt-7">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Preparing download...
                </>
              ) : (
                <>
                  <QrCode size={17} />
                  Download QR Poster
                </>
              )}
            </button>

            {downloadError && (
              <p role="alert" className="text-xs text-red-600 text-center mt-3">
                {downloadError}
              </p>
            )}

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Downloads a printable poster with a large QR code.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-100">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-white flex items-center justify-center text-blue-600">
          <Sparkles size={18} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-blue-950">
            Easy project sharing
          </h3>

          <p className="text-xs sm:text-sm text-blue-800/80 mt-1 leading-relaxed">
            You can download it, print it, or share the link.
          </p>
        </div>
      </div>
    </div>
  );
}
export function makeReleaseView(metadata, details, origin) {
  if (!metadata || typeof metadata !== "object" || typeof metadata.version !== "string" || !metadata.version.trim()) {
    throw new Error("Latest release metadata is incomplete.");
  }
  if (typeof metadata.downloadUrl !== "string") {
    throw new Error("Latest release download URL is missing.");
  }

  let target;
  try {
    target = new URL(metadata.downloadUrl, origin);
  } catch {
    throw new Error("Latest release download URL is invalid.");
  }
  if (target.origin !== origin || target.pathname !== "/download/latest") {
    throw new Error("Latest release download URL is not approved.");
  }

  const sizeBytes = Number.isFinite(details?.sizeBytes) && details.sizeBytes > 0 ? details.sizeBytes : null;
  const publishedAt = typeof metadata.publishedAt === "string" ? metadata.publishedAt : "";
  const parsedDate = publishedAt ? new Date(publishedAt) : null;
  const dateText = parsedDate && !Number.isNaN(parsedDate.valueOf())
    ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(parsedDate)
    : "ไม่ระบุ";
  const sizeText = sizeBytes
    ? `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(sizeBytes / (1024 * 1024))} MB`
    : "ไม่ระบุ";

  return {
    version: metadata.version.trim(),
    releaseNotes: typeof metadata.releaseNotes === "string" ? metadata.releaseNotes.trim() : "",
    publishedAt,
    downloadUrl: `${target.pathname}${target.search}${target.hash}`,
    platform: typeof details?.platform === "string" && details.platform ? details.platform : "Android",
    architecture: typeof details?.architecture === "string" && details.architecture ? details.architecture : "ARM64",
    fileName: typeof details?.fileName === "string" && details.fileName ? details.fileName : "ไฟล์ APK รุ่นล่าสุด",
    sizeText,
    dateText,
  };
}

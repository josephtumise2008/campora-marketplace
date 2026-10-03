import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { cx } from "../../utils/format";
import { prepareImage } from "../../utils/image";
import { uploadImage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { SmartImage } from "./SmartImage";

interface ImageUploaderProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Maximum number of images; use 1 for logos and covers. */
  max?: number;
  label?: string;
  hint?: string;
  coverLabel?: string;
  single?: boolean;
  onError?: (message: string) => void;
}

interface Pending {
  id: string;
  name: string;
  file: File;
  preview: string;
}

/**
 * Device photo picker that behaves the same on desktop and phones: tap to open
 * the file browser, drag and drop on a laptop, or shoot a photo straight from
 * the camera roll. Pictures are downscaled in the browser before upload.
 */
export function ImageUploader({
  value,
  onChange,
  max = 6,
  label = "Photos",
  hint,
  coverLabel = "Cover",
  single = false,
  onError,
}: ImageUploaderProps) {
  const toast = useToast();
  const inputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);

  const room = Math.max(0, max - value.length - pending.length);
  const busy = pending.length > 0;

  useEffect(
    () => () => {
      pending.forEach((item) => URL.revokeObjectURL(item.preview));
    },
    [pending]
  );

  const onFiles = useCallback(
    async (list: FileList | null) => {
      const picked = Array.from(list || []).filter(
        (file) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(file.name)
      );
      if (picked.length === 0) {
        const message = "Choose an image file from your device";
        onError?.(message);
        toast.error(message);
        return;
      }

      const batch = picked.slice(0, room);
      if (batch.length < picked.length) {
        toast.info(`You can use ${max} image${max === 1 ? "" : "s"} — the rest were skipped`);
      }
      if (batch.length === 0) return;

      const queued: Pending[] = batch.map((file, index) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${index}`,
        name: file.name,
        file,
        preview: URL.createObjectURL(file),
      }));
      setPending((current) => [...current, ...queued]);

      const added: string[] = [];
      for (const item of queued) {
        try {
          const prepared = await prepareImage(item.file);
          const asset = await uploadImage(prepared.blob, prepared.name);
          added.push(asset.url);
        } catch (error) {
          const message = error instanceof Error ? error.message : `Could not upload ${item.name}`;
          onError?.(message);
          toast.error(message);
        }
      }

      setPending((current) => current.filter((entry) => !queued.some((item) => item.id === entry.id)));
      queued.forEach((item) => URL.revokeObjectURL(item.preview));

      if (added.length > 0) {
        onChange(single ? added.slice(-1) : [...value, ...added]);
        toast.success(
          added.length === 1 ? "Image uploaded" : `${added.length} images uploaded`,
          single ? "Looking sharp" : "They are live in your listing"
        );
      }
    },
    [max, onChange, onError, room, single, toast, value]
  );

  const remove = (src: string) => onChange(value.filter((entry) => entry !== src));
  const makeCover = (src: string) => onChange([src, ...value.filter((entry) => entry !== src)]);

  const pickerProps = {
    accept: "image/*",
    multiple: !single,
    className: "sr-only",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) void onFiles(event.target.files);
      event.target.value = "";
    },
  };

  return (
    <div
      className={cx("uploader", dragging && "is-dragging")}
      onDragOver={(event) => {
        event.preventDefault();
        if (room > 0) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (room > 0) void onFiles(event.dataTransfer.files);
      }}
    >
      <div className="uploader__head">
        <p className="field__label">
          {label}
          <span className="uploader__count">
            {value.length}
            {single ? "" : ` / ${max}`}
          </span>
        </p>
        {hint ? <p className="field__hint">{hint}</p> : null}
      </div>

      <ul className="uploader__grid">
        {value.map((src, index) => (
          <li key={src} className="uploader__item">
            <SmartImage src={src} alt={`${label} ${index + 1}`} ratio="square" fallbackLabel="Photo" />
            {index === 0 ? <span className="uploader__badge">{coverLabel}</span> : null}
            <div className="uploader__tools">
              {index !== 0 ? (
                <button
                  type="button"
                  onClick={() => makeCover(src)}
                  aria-label={`Make image ${index + 1} the ${coverLabel.toLowerCase()}`}
                  title={`Make ${coverLabel.toLowerCase()}`}
                >
                  <Star size={13} aria-hidden="true" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(src)}
                aria-label={`Remove image ${index + 1}`}
                title="Remove"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}

        {pending.map((item) => (
          <li key={item.id} className="uploader__item is-pending" aria-busy="true">
            <img src={item.preview} alt="" />
            <span className="uploader__overlay">
              <Loader2 size={18} className="spinner" aria-hidden="true" />
            </span>
          </li>
        ))}

        {room > 0 ? (
          <li className="uploader__add">
            <label htmlFor={inputId} className="uploader__drop">
              <input id={inputId} type="file" {...pickerProps} />
              <Upload size={22} aria-hidden="true" />
              <strong>Choose a photo</strong>
              <span>Tap or drop it here</span>
            </label>
          </li>
        ) : null}
      </ul>

      <div className="uploader__actions">
        <label className={cx("btn btn--ghost btn--sm", room === 0 && "is-disabled")}>
          <ImagePlus size={14} aria-hidden="true" />
          {single ? "Replace from device" : "Add from device"}
          <input type="file" {...pickerProps} disabled={room === 0} />
        </label>

        {/* Phones open the camera; desktop browsers fall back to the file browser. */}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => cameraRef.current?.click()}
          disabled={room === 0}
        >
          <Camera size={14} aria-hidden="true" />
          Take a photo
        </button>
        <input
          ref={cameraRef}
          {...pickerProps}
          capture="environment"
          disabled={room === 0}
        />
      </div>

      <p className="uploader__note">
        {busy ? "Uploading…" : "Desktop and phone supported · JPG, PNG, WEBP, GIF, AVIF or SVG up to 10 MB"}
      </p>
    </div>
  );
}
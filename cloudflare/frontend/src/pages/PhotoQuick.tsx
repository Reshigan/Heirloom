import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { WeaveCeremony } from '../loom/components/WeaveCeremony';
import { uploadMemoryImage, validateImage, type UploadedImage } from '../utils/uploadImage';
import { RoomHeader } from '../loom/components/room';

/**
 * PhotoQuick — the fast lane (§ photo entry).
 *
 * Pick a photo, add one line, weave. No recipient, no delivery trigger, no dye
 * picker — the quickest path from a phone photo to a thread in the cloth. The full
 * Compose surface remains for writing; this is for the moment you just want the picture in.
 */
const EASE = 'cubic-bezier(0.16,1,0.3,1)';

interface QuickImage {
  id: string;
  url: string;
  uploading: boolean;
  progress: number;
  fileKey?: string;
  fileUrl?: string;
  mimeType?: string;
  error?: boolean;
}

export function PhotoQuick() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [images, setImages] = useState<QuickImage[]>([]);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [woven, setWoven] = useState(false);

  // Revoke all blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => { if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url); });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear navigate timer on unmount
  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current);
    };
  }, []);

  const addImages = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    Array.from(files).forEach((file) => {
      const err = validateImage(file);
      if (err) {
        setError(err);
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = URL.createObjectURL(file);
      setImages((prev) => [...prev, { id, url, uploading: true, progress: 0, mimeType: file.type }]);
      uploadMemoryImage(file, (pct) =>
        setImages((prev) => prev.map((im) => (im.id === id ? { ...im, progress: pct } : im))),
      )
        .then((res: UploadedImage) =>
          setImages((prev) =>
            prev.map((im) =>
              im.id === id
                ? { ...im, uploading: false, progress: 100, fileKey: res.fileKey, fileUrl: res.fileUrl }
                : im,
            ),
          ),
        )
        .catch(() =>
          setImages((prev) => prev.map((im) => (im.id === id ? { ...im, uploading: false, error: true } : im))),
        );
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((im) => im.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((im) => im.id !== id);
    });
  }, []);

  const uploadingCount = images.filter((im) => im.uploading).length;
  const readyImages = images.filter((im) => im.fileKey && !im.error);

  const save = useMutation({
    mutationFn: async () => {
      const primary = readyImages[0];
      const { data } = await memoriesApi.create({
        type: 'PHOTO',
        title: caption.trim() || 'A photograph',
        description: caption.trim(),
        fileKey: primary?.fileKey,
        fileUrl: primary?.fileUrl,
        mimeType: primary?.mimeType,
        metadata: {
          visibility: 'family',
          dye: 'walnut',
          dyeMotif: 'walnut',
          entryDate: new Date().toISOString().slice(0, 10),
          images: readyImages.map((p) => ({ fileKey: p.fileKey, fileUrl: p.fileUrl, mimeType: p.mimeType })),
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-memories'] });
      setWoven(true);
      navigateTimer.current = setTimeout(() => navigate('/loom/index'), 4200);
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Could not save the photo.'),
  });

  if (woven) {
    return (
      <WeaveCeremony
        dye="walnut"
        entryDate={new Date()}
        seed={caption || 'photograph'}
        eyebrow="woven into the cloth"
        headline="Your photograph is part of the cloth."
      />
    );
  }

  const canSave = readyImages.length > 0 && uploadingCount === 0 && !save.isPending;

  const topbarLeft = (
    <Breadcrumbs trail={[{ label: 'cloth', to: '/loom/weft' }, { label: 'index', to: '/loom/index' }, { label: 'photograph' }]} />
  );

  return (
    <ClothShell topbarLeft={topbarLeft}>
      <div style={{ maxWidth: 'var(--page-max-focus)', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>
        <RoomHeader
          eyebrow="the fast lane"
          title="A photograph, straight into the cloth."
          lede="Pick a photo, add one line, weave. The full Composer is there when you want to write."
          className="hl-mb-section"
        />
        <div style={{ height: 36 }} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addImages(e.target.files);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />

        {images.length === 0 ? (
          <button
            type="button"
            aria-label="Choose a photograph"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              minHeight: 'clamp(240px, 40vh, 360px)',
              background: 'transparent',
              border: '1px solid var(--rule)',
              color: 'var(--bone-dim)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              transition: `border-color 360ms ${EASE}, color 360ms ${EASE}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--bone-dim)';
              e.currentTarget.style.color = 'var(--bone)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--rule)';
              e.currentTarget.style.color = 'var(--bone-dim)';
            }}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: 28, color: 'var(--warm)' }}>∞</span>
            <span
              className="hl-serif hl-italic"
              style={{ fontSize: 'clamp(18px, 4vw, 22px)', color: 'var(--bone)' }}
            >
              Choose a photograph
            </span>
            <span
              className="hl-mono"
              style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
            >
              jpg · png · webp · up to 25 mb
            </span>
          </button>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 28,
              }}
            >
              {images.map((im) => (
                <div key={im.id} style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden' }}>
                  <img
                    src={im.url}
                    alt=""
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      filter: im.uploading ? 'brightness(0.6)' : 'none',
                      opacity: im.error ? 0.4 : 1,
                    }}
                  />
                  {im.uploading && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        height: 2,
                        width: `${im.progress}%`,
                        background: 'var(--warm)',
                        transition: 'width 180ms linear',
                      }}
                    />
                  )}
                  {im.error && (
                    <span
                      className="hl-mono"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--danger)',
                      }}
                    >
                      failed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(im.id)}
                    aria-label="Remove photo"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      minWidth: 44,
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(14,14,12,0.7)',
                      border: 0,
                      color: 'var(--bone)',
                      fontFamily: 'var(--mono)',
                      fontSize: 15,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              aria-label="Caption for photograph"
              placeholder="A line about this photograph — or leave it"
              style={{
                width: '100%',
                border: 0,
                borderBottom: '1px solid var(--rule)',
                background: 'transparent',
                color: 'var(--bone)',
                caretColor: 'var(--warm)',
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 'clamp(18px, 3.5vw, 22px)',
                padding: '0 0 8px',
                outline: 'none',
                marginBottom: 28,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = 'var(--warm)')}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'var(--rule)')}
            />

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--bone-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                + add another
              </button>
              <button
                type="button"
                onClick={() => {
                  if (uploadingCount > 0) {
                    setError('Wait for the photo to finish uploading.');
                    return;
                  }
                  save.mutate();
                }}
                disabled={!canSave}
                className="hl-btn"
                style={{
                  marginLeft: 'auto',
                  cursor: canSave ? 'pointer' : 'default',
                  opacity: canSave ? 1 : 0.45,
                }}
              >
                {save.isPending ? 'weaving…' : 'weave into cloth →'}
              </button>
            </div>
          </>
        )}

        {error && (
          <p
            role="alert"
            style={{
              marginTop: 20,
              fontStyle: 'italic',
              color: 'var(--danger)',
              fontSize: 14,
              fontFamily: 'var(--serif)',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </ClothShell>
  );
}

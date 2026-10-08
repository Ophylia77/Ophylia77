import { useEffect, useRef, useState } from 'react';

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
  }
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const VALID_CODE = /^\d{8,14}$/;

interface Props {
  onDetected: (code: string) => void;
}

/**
 * Camera barcode scanner. Uses the native BarcodeDetector API where available
 * (Chrome/Android, Safari 17+) and falls back to ZXing (loaded on demand).
 * Camera access requires HTTPS (or localhost).
 */
export function Scanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current!;
    let cancelled = false;
    let stopFn: () => void = () => {};

    const found = (code: string) => {
      if (cancelled || !VALID_CODE.test(code)) return;
      cancelled = true;
      stopFn();
      navigator.vibrate?.(80);
      setActive(false);
      onDetectedRef.current(code);
    };

    (async () => {
      try {
        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({ formats: FORMATS });
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (cancelled) return stream.getTracks().forEach((t) => t.stop());
          video.srcObject = stream;
          await video.play();
          let timer = 0;
          stopFn = () => {
            window.clearTimeout(timer);
            stream.getTracks().forEach((t) => t.stop());
          };
          const tick = async () => {
            if (cancelled) return;
            try {
              const codes = await detector.detect(video);
              if (codes[0]) return found(codes[0].rawValue);
            } catch {
              /* frame not ready */
            }
            timer = window.setTimeout(tick, 200);
          };
          tick();
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            video,
            (result) => result && found(result.getText()),
          );
          stopFn = () => controls.stop();
          if (cancelled) controls.stop();
        }
      } catch (e) {
        const name = (e as Error).name;
        setError(
          name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser settings, or type the barcode below.'
            : 'Could not start the camera. Make sure the app is opened over HTTPS, or type the barcode below.',
        );
        setActive(false);
      }
    })();

    return () => {
      cancelled = true;
      stopFn();
    };
  }, [active]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manual.replace(/\D/g, '');
    if (VALID_CODE.test(code)) onDetected(code);
    else setError('Barcodes are 8 to 14 digits long.');
  };

  return (
    <section className="scanner">
      <div className={`viewfinder ${active ? 'on' : ''}`}>
        <video ref={videoRef} muted playsInline />
        {active ? (
          <div className="aim" aria-hidden />
        ) : (
          <button className="btn primary big" onClick={() => { setError(null); setActive(true); }}>
            <span aria-hidden>📷</span> Start scanning
          </button>
        )}
      </div>
      {active && (
        <button className="btn ghost" onClick={() => setActive(false)}>
          Stop camera
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}

      <form className="manual" onSubmit={submitManual}>
        <label htmlFor="barcode">Or enter a barcode</label>
        <div className="row">
          <input
            id="barcode"
            inputMode="numeric"
            placeholder="e.g. 3017624010701"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button className="btn primary" type="submit">Look up</button>
        </div>
      </form>
    </section>
  );
}

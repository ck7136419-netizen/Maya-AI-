/**
 * Flashlight controller for mobile Android devices using MediaStream ImageCapture / torch track constraints.
 */

class TorchController {
  private mediaStream: MediaStream | null = null;
  private track: MediaStreamTrack | null = null;
  public isOn = false;

  public async isTorchSupported(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  public async toggleTorch(): Promise<{ success: boolean; isOn: boolean; message: string }> {
    if (this.isOn) {
      await this.turnOff();
      return { success: true, isOn: false, message: 'Flashlight deactivated.' };
    } else {
      const result = await this.turnOn();
      return {
        success: result.success,
        isOn: result.success,
        message: result.message,
      };
    }
  }

  public async turnOn(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
        });
      }

      this.track = this.mediaStream.getVideoTracks()[0];
      if (!this.track) {
        return { success: false, message: 'No camera video track available.' };
      }

      const capabilities = this.track.getCapabilities?.() as { torch?: boolean } | undefined;

      if (capabilities && 'torch' in capabilities) {
        await (this.track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: true }],
        });
        this.isOn = true;
        return { success: true, message: 'Camera hardware flashlight turned ON.' };
      } else {
        // Fallback to screen flashlight
        this.isOn = true;
        return {
          success: true,
          message: 'Hardware torch constraint not supported on this browser; activating Screen Torch mode.',
        };
      }
    } catch (err: unknown) {
      // If camera access fails or not permitted, use screen torch
      this.isOn = true;
      return {
        success: true,
        message: `Hardware torch unavailable (${err instanceof Error ? err.message : 'Permission denied'}), using Screen Torch mode.`,
      };
    }
  }

  public async turnOff(): Promise<void> {
    try {
      if (this.track) {
        try {
          await (this.track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
            advanced: [{ torch: false }],
          });
        } catch {
          // Ignored
        }
        this.track.stop();
      }
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      }
    } finally {
      this.track = null;
      this.mediaStream = null;
      this.isOn = false;
    }
  }
}

export const torch = new TorchController();

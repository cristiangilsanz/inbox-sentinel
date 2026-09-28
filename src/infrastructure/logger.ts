export class Logger {
  private static useStderr = false;

  // Toggle stderr output mode for stdio compatibility
  static setUseStderr(enabled: boolean): void {
    this.useStderr = enabled;
  }

  // Write formatted output line to configured stream
  private static output(line: string): void {
    if (this.useStderr) {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  // Log workflow initiation message
  static start(scope: string, message: string): void {
    this.output(`🚀 [${scope}] ${message}`);
  }

  // Log active processing progress message
  static progress(scope: string, message: string): void {
    this.output(`⚙️ [${scope}] ${message}`);
  }

  // Log informational status message
  static info(scope: string, message: string): void {
    this.output(`ℹ️ [${scope}] ${message}`);
  }

  // Log operational success message
  static success(scope: string, message: string): void {
    this.output(`✅ [${scope}] ${message}`);
  }

  // Log operational warning message
  static warn(scope: string, message: string): void {
    console.warn(`⚠️ [${scope}] ${message}`);
  }

  // Log error failure message
  static error(scope: string, message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(`❌ [${scope}] ${message}`, error);
    } else {
      console.error(`❌ [${scope}] ${message}`);
    }
  }
}

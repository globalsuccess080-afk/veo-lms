import fs from 'fs/promises';

export class CleanupService {
  /**
   * Deletes a file or directory gracefully, catching ENOENT if it doesn't exist.
   */
  static async deletePath(targetPath: string): Promise<void> {
    try {
      const stats = await fs.stat(targetPath);
      if (stats.isDirectory()) {
        await fs.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.unlink(targetPath);
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

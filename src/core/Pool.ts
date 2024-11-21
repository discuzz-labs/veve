/*
 * Copyright (c) 2024 Discuzz Labs Organization
 * Licensed under the MIT License.
 * See the LICENSE file in the project root for license information.
 */

import { Console, LogEntry, replay } from "./Console.js";
import { TestReport } from "../framework/TestCase";
import { Isolated } from "./Isolated.js";
import { Process } from "./Process.js";
import { Transform } from "./Transform.js";
import { Terminal } from "./Terminal.js";
import { Reporter } from "../reporters/Reporter.js";
import { Plugin } from "esbuild";
import path from "path";
import { ErrorInspect } from "./ErrorInspect.js";

export interface PoolResult {
  error: any;
  report: TestReport | null;
  duration: number;
  logs: LogEntry[];
}

export class Pool {
  private readonly terminal = new Terminal();
  private readonly processClone = new Process();
  private transformer;
  private reports = new Map<string, PoolResult>();

  constructor(
    private readonly options: {
      testFiles: string[];
      timeout: number;
      plugins: Plugin[];
      context: Record<any, any>;
      tsconfig: string;
    },
  ) {
    this.transformer = new Transform({
      plugins: options.plugins,
      tsconfig: this.options.tsconfig,
    });
  }

  async run(): Promise<number> {
    let exitCode = 0;
    const startTimes = new Map<string, number>();

    // Initialize terminal with "pending" state for all files
    this.options.testFiles.forEach((file) => {
      this.terminal.set(file, "pending");
    });
    this.terminal.render(); // Initial render

    // Limit the number of concurrent tests for efficiency
    const maxConcurrentTests = 4; // Adjust based on available resources
    const chunks = this.chunkArray(this.options.testFiles, maxConcurrentTests);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (file) => {
          const start = Date.now();
          startTimes.set(file, start);

          try {
            const logger = new Console();

            // Load the test code
            const code = await this.transformer.transform(file);

            // Create isolated environment and context
            const isolated = new Isolated(file);

            const context = isolated.context({
              ...this.options.context,
              ...this.processClone.context(),
              console: logger,
            });
            const script = isolated.script(code);
            const exec = await isolated.exec({
              script,
              context,
              timeout: this.options.timeout,
            });

            const end = Date.now();

            // Update terminal and report results
            const status =
              exec.status && exec.report ? exec.report.status : "failed";
            this.terminal.update(file, status);
            this.reports.set(file, {
              error: null,
              duration: (end - start) / 1000,
              report: exec.report,
              logs: logger.logs,
            });
          } catch (error: any) {
            const end = Date.now();
            this.reports.set(file, {
              error,
              duration: (end - start) / 1000,
              report: null,
              logs: [],
            });
            this.terminal.update(file, "failed");
          }
        }),
      );
      this.terminal.render(); // Render after each chunk completes
    }

    return exitCode;
  }

  report() {
    //console.clear();

    for (const [file, { logs, error, duration, report }] of this.reports) {
      const status = report ? report.status : "failed";
      const stats = report?.stats || {
        total: 0,
        passed: 0,
        failed: 0,
        softfailed: 0,
        skipped: 0,
        todo:0
      };
      const description = report?.description || path.basename(file);

      process.stdout.write(
        Reporter.header({ description, file, duration, status, stats }),
      );

      if (report) process.stdout.write(Reporter.report({ file, report }));
      if (error)
        process.stdout.write(ErrorInspect.format({ error, file, maxLines: 10 }));

      replay(logs);
    }

    process.stdout.write(Reporter.summary());
  }

  // Helper function to split files into chunks
  private chunkArray(array: string[], chunkSize: number): string[][] {
    const results: string[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }
}

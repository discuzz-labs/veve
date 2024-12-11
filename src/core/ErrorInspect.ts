import esbuild from "esbuild";
import { SourceMapConsumer } from "source-map";
import kleur from "kleur";

interface ParsedStackFrame {
  file?: string;
  lineNumber?: number;
  column?: number;
}

export interface ErrorMetadata {
  message: string;
  stack?: string;
}

export interface ErrorInspectOptions {
  error: ErrorMetadata | Error;
  file?: string;
  sourceMap?: SourceMapConsumer;
}

export class ErrorInspect {
  private static readonly STACK_FRAME_REGEX =
    /^\s*at (?!new Script) ?(?:([^\(]+) )?\(?([^:]+):(\d+):(\d+)\)?\s*$/i;

  private static readonly CONTEXT_LINES = 3;

  private static line(
    parsed: ParsedStackFrame,
    options: ErrorInspectOptions,
  ): string {
    const file = parsed.file?.padEnd(30) || "";
    const line = parsed.lineNumber ?? 0;
    const column = parsed.column ?? 0;

    // Resolve original source location using source map
    const original = options.sourceMap?.originalPositionFor({
      line,
      column,
    });

    return `→ ${file} ${kleur.bold(original?.line || line)}:${kleur.bold(original?.column || column)}`;
  }

  private static parse(line: string): ParsedStackFrame | null {
    const parts = this.STACK_FRAME_REGEX.exec(line);
    if (!parts) return null;

    return {
      file: parts[2],
      lineNumber: +parts[3],
      column: +parts[4],
    };
  }

  private static stack(stack: string, options: ErrorInspectOptions): string {
    // Split stack trace into lines
    const stackLines = stack.split("\n");
    const formattedStackLines: string[] = [];

    // Process each line of the stack trace
    const processedStack = stackLines.reduce<string[]>((acc, line) => {
      // Parse and format each line
      const parsed = this.parse(line);
      const formattedLine = parsed
        ? this.line(parsed, options)
        : `Parsing failed: ${line.trim()}`;

      formattedStackLines.push(formattedLine);

      // Filter lines based on optional file parameter
      if (!options.file || line.includes(options.file)) {
        acc.push(line.trim());
      }

      return acc;
    }, []);

    // Fallback to formatted lines if no matching lines found
    return processedStack.length === 0
      ? formattedStackLines.join("\n")
      : this.context(processedStack[0], options) ||
          formattedStackLines.join("\n");
  }

  private static context(
    stackLine: string,
    options: ErrorInspectOptions,
  ): string | null {
    // Parse the raw stack line
    const parsed = this.parse(stackLine);
    if (!parsed || !options.sourceMap) return null;

    // Resolve original source location
    const original =
      parsed.lineNumber && parsed.column
        ? options.sourceMap.originalPositionFor({
            line: parsed.lineNumber,
            column: parsed.column,
          })
        : null;

    // Validate source map content
    const sourcesContent = (options.sourceMap as any).sourcesContent;
    if (!sourcesContent || !original || original.line === null) {
      return null;
    }

    // Split source into lines
    const sourceLines = sourcesContent[0].split("\n");

    // Calculate line range with context
    const targetLine = original.line - 1; // Convert to 0-indexed
    const startLine = Math.max(0, targetLine - this.CONTEXT_LINES);
    const endLine = Math.min(
      sourceLines.length - 1,
      targetLine + this.CONTEXT_LINES,
    );

    // Build formatted source context
    const formattedLines: string[] = [this.line(parsed, options)];

    for (let i = startLine; i <= endLine; i++) {
      const isTargetLine = i === targetLine;
      const lineNumber = (i + 1).toString().padStart(2, " ");
      const line = isTargetLine
        ? kleur.bold(sourceLines[i])
        : kleur.dim(sourceLines[i]);

      formattedLines.push(
        `${isTargetLine ? kleur.red(">") : ""} ${kleur.gray(lineNumber)}|${" ".repeat(2)}${line}`,
      );
    }

    return formattedLines.join("\n");
  }

  private static buildMessage(
    messages: any[],
    type: "error" | "warning",
  ): string {
    if (!Array.isArray(messages) || messages.length === 0) return "";

    // Use esbuild's message formatting
    const formattedMessages = esbuild.formatMessagesSync(messages, {
      kind: type,
      color: true, // Disable colors for cleaner output
    });

    return formattedMessages.map((msg) => msg.trim()).join("\n");
  }

  static format(options: ErrorInspectOptions): string {
    // Create a divider for visual separation
    const divider = "─".repeat(60);

    // Extract error message or use default
    const header = options.error?.message || "No message available.";

    // Process stack trace
    const body = options.error?.stack
      ? this.stack(options.error.stack, options)
      : "No stack trace available\n";

    // Format build-related messages
    let buildOutput = "";
    if (options.error) {
      const { errors = [], warnings = [] } = options.error as any;
      const errorMessages = this.buildMessage(errors, "error");
      const warningMessages = this.buildMessage(warnings, "warning");

      // Combine non-empty messages
      buildOutput = [errorMessages, warningMessages]
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }

    // Construct final output
    const output = [
      divider,
      buildOutput || `${header}\n\n${body}`,
      divider,
    ].join("\n");

    return output;
  }
}

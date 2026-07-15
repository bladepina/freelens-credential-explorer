import { Main } from "@freelensapp/extensions";
import { debugLog, getDebugFilePath } from "../common/debug";

debugLog("main", "module loaded", { debugFilePath: getDebugFilePath() });

function extensionMeta(extension: unknown): Record<string, unknown> {
	const candidate = extension as Record<string, unknown>;

	return {
		id: candidate.id,
		name: candidate.name,
		version: candidate.version,
		manifestPath: candidate.manifestPath
	};
}

export default class CredentialExplorerMainExtension extends Main.LensExtension {
	protected async onActivate(): Promise<void> {
		const meta = extensionMeta(this);
		debugLog("main", "onActivate", meta);

		try {
			const folder = await (this as unknown as { getExtensionFileFolder: () => Promise<string> }).getExtensionFileFolder();
			debugLog("main", "extension folder resolved", { folder });

			const fs = require("node:fs") as typeof import("node:fs");
			const path = require("node:path") as typeof import("node:path");
			const filePath = path.join(folder, "credential-explorer-debug.log");

			fs.appendFileSync(
				filePath,
				`[${new Date().toISOString()}] main onActivate ${JSON.stringify(meta)}\n`,
				"utf8"
			);
			debugLog("main", "extension folder log written", { filePath });
		} catch (error) {
			debugLog("main", "extension folder log failed", { error: String(error) });
		}
	}

	protected onDeactivate(): void {
		debugLog("main", "onDeactivate", extensionMeta(this));
	}
}

"use client";
import { useRef, useState } from "react";
import { Upload, SlidersHorizontal, FileText, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/hooks/workspace";
import { Button } from "@/components/ui/button";
import {
  DatasetBars,
  ProfileMetrics,
  SectionHeading,
} from "@/components/shared";
import type { DataValue, DataType } from "@/types";
import { parseInputData } from "@/lib/parse-data";
export function InputPanel() {
  const w = useWorkspace(),
    file = useRef<HTMLInputElement>(null);
  const [advanced, setAdvanced] = useState(false),
    [filename, setFilename] = useState("");
  let parsed: DataValue[] = [];
  let error = "";
  try {
    parsed = parseInputData(w.pasteDraft, w.dataType);
  } catch (e) {
    error = (e as Error).message;
  }
  const submit = () => {
    try {
      const data = parseInputData(w.pasteDraft, w.dataType),
        queries =
          w.domain === "searching"
            ? parseInputData(w.queryDraft, w.dataType)
            : [];
      if (!data.length)
        throw Error("Type, paste, or upload at least one value.");
      if (w.domain === "searching" && !queries.length)
        throw Error("Enter the value(s) you want to search for.");
      w.setDatasetName(filename || "Typed / pasted dataset");
      w.changeInput({ ...w.input, data, queries });
    } catch (e) {
      w.setError((e as Error).message);
    }
  };
  return (
    <section className="card input-panel">
      <SectionHeading step="01" title="Bring your own data">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdvanced(!advanced)}
        >
          <SlidersHorizontal size={15} /> Options
        </Button>
      </SectionHeading>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={w.running || w.busy}>
          <div className="input-tabs">
            <span className="input-method">
              <FileText size={16} /> Type or paste your data
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => file.current?.click()}
            >
              <Upload size={15} /> Upload data
            </Button>
            <input
              ref={file}
              type="file"
              hidden
              accept=".csv,.txt,.json"
              aria-label={
                w.dataType === "number"
                  ? "Upload numeric data"
                  : "Upload text data"
              }
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 1024 * 1024) {
                    w.setError("Upload a file smaller than 1 MB.");
                    return;
                  }
                  w.setPasteDraft(await f.text());
                  setFilename(f.name);
                  w.setInputPending(true);
                }
                e.target.value = "";
              }}
            />
          </div>
          <div className="manual-input">
            <label className="data-type-control">
              Input type
              <select
                value={w.dataType}
                onChange={(e) => {
                  w.setDataType(e.target.value as DataType);
                  w.setInputPending(true);
                  w.setError("");
                }}
              >
                <option value="number">Integers</option>
                <option value="text">Text / alphanumeric</option>
              </select>
            </label>
            <label htmlFor="data-input">
              {w.dataType === "number"
                ? "Integers separated by commas, spaces, or newlines"
                : "Text values separated by commas, spaces, or newlines"}
            </label>
            <textarea
              id="data-input"
              value={w.pasteDraft}
              onChange={(e) => {
                w.setPasteDraft(e.target.value);
                w.setInputPending(true);
                setFilename("");
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.ctrlKey || e.metaKey) &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={
                w.dataType === "number"
                  ? "Type here: 38, 12, -7, 5"
                  : "Type here: apple, A12, banana, A2"
              }
              aria-describedby="paste-format-help"
            />
            <p id="paste-format-help" className="input-help">
              Type directly, paste a column, or upload CSV, TXT, or a JSON
              array. Omit headings. Click Analyze input or press Ctrl+Enter
              (⌘+Enter on Mac). Enter alone adds a new line.
              {w.dataType === "text" && (
                <>
                  {" "}
                  Quote phrases, e.g. &quot;New York&quot;. Text uses
                  case-sensitive Unicode order: A10 comes before A2, and A
                  before a. Numeric-looking IDs such as 0012 stay text. Search
                  matches the complete value exactly.
                </>
              )}
            </p>
            <div className="parse-preview" aria-live="polite">
              <strong>
                {error
                  ? "Check your input"
                  : parsed.length
                    ? `${parsed.length} ${w.dataType === "number" ? "integers" : "text values"} read from your ${filename ? "file" : "text"}`
                    : "Waiting for your data"}
              </strong>
              {error ? (
                <p className="text-error">{error}</p>
              ) : (
                <code>
                  {parsed.length
                    ? `[${parsed.slice(0, 16).join(", ")}${parsed.length > 16 ? ", …" : ""}]`
                    : "No example data is loaded automatically."}
                </code>
              )}
              <small>
                {w.inputPending
                  ? "Draft — analyze to apply this input."
                  : "The visualizer uses your analyzed input."}
              </small>
            </div>
            {w.domain === "searching" && (
              <label className="query-input">
                {w.dataType === "number"
                  ? "Numbers to search for"
                  : "Text values to search for"}
                <input
                  value={w.queryDraft}
                  onChange={(e) => {
                    w.setQueryDraft(e.target.value);
                    w.setInputPending(true);
                  }}
                  placeholder="Enter one or more target values"
                />
                <small>
                  Each target gets its own search. Visual playback supports up
                  to 8 targets.
                </small>
              </label>
            )}
            <Button type="submit" disabled={!parsed.length || !!error}>
              Analyze input <ArrowRight size={16} />
            </Button>
          </div>
          {advanced && (
            <div className="advanced-grid">
              <label>
                Memory policy
                <select
                  value={w.input.memory}
                  onChange={(e) =>
                    w.changeInput({
                      ...w.input,
                      memory: e.target.value as "balanced" | "limited",
                    })
                  }
                >
                  <option value="balanced">Balanced</option>
                  <option value="limited">Limited auxiliary memory</option>
                </select>
              </label>
              {w.domain === "sorting" && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={w.input.stable}
                    onChange={(e) =>
                      w.changeInput({ ...w.input, stable: e.target.checked })
                    }
                  />{" "}
                  Require a stable sort
                </label>
              )}
            </div>
          )}
          {w.domain === "searching" && (
            <div className="search-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={w.input.allow_preprocessing}
                  onChange={(e) =>
                    w.changeInput({
                      ...w.input,
                      allow_preprocessing: e.target.checked,
                    })
                  }
                />{" "}
                Allow sorting before Binary Search (included in timing)
              </label>
              <label>
                Expected updates per batch
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={w.input.updates}
                  onChange={(e) =>
                    w.changeInput({
                      ...w.input,
                      updates: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          )}
        </fieldset>
      </form>
      {!!w.input.data.length && (
        <div className="dataset-preview">
          <div className="input-receipt">
            <strong>
              {w.inputPending
                ? "Last analyzed input (draft not applied)"
                : "Current analyzed input"}
            </strong>
            <span>
              {w.datasetName} · {w.input.data.length}{" "}
              {typeof w.input.data[0] === "string" ? "text values" : "integers"}
            </span>
            <code>
              [{w.input.data.slice(0, 16).join(", ")}
              {w.input.data.length > 16 ? ", …" : ""}]
            </code>
            {w.domain === "searching" && (
              <small>Applied queries: [{w.input.queries.join(", ")}]</small>
            )}
          </div>
          <DatasetBars data={w.input.data} />
        </div>
      )}
      {w.selection && (
        <>
          <ProfileMetrics profile={w.selection.profile} />
          <details className="metric-help">
            <summary>What do these measurements mean?</summary>
            <p>
              Adjacent order measures neighboring pairs already in ascending
              order. Duplicates count repeated values. Range is maximum minus
              minimum plus one for integers; text shows the longest value in
              characters. An inversion is a pair with a larger value before a
              smaller value. Neighbor checks use O(n) comparisons. Exact
              inversions use merge-and-count divide and conquer: O(n log n)
              comparisons and O(n) auxiliary space. For text, a comparison may
              inspect up to L characters, giving O(L n log n) worst-case
              analysis. Profiling happens before recommendation; benchmark
              timings measure algorithm execution separately.
            </p>
          </details>
        </>
      )}
    </section>
  );
}

import { useState } from "react";
import axios from "axios";
import type { RenderProgress } from "@remotion/lambda/client";

const FRAMEWORKS = ["Astro", "Nextjs", "Remix", "SolidStart", "StaticSite"];
const COLORS = ["#FF0000", "#00FF00", "#0000FF", "#FF00FF", "#00FFFF", "#FF00FF"];

const render = async (data: { framework: string; color: string }) => {
  const res = await axios.post<{ renderId: string }>("/api/render", data);
  return res.data.renderId;
};

const getProgress = async (renderId: string) => {
  const res = await axios.get<RenderProgress>(`/api/progress?renderId=${renderId}`);
  return res.data;
};

export const Video = () => {
  const [framework, setFramework] = useState(FRAMEWORKS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [status, setStatus] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    console.log(framework, color);
    setStatus("rendering");
    const renderId = await render({ framework, color });

    const interval = setInterval(async () => {
      const progress = await getProgress(renderId);
      if (progress.fatalErrorEncountered) {
        setStatus("error");
        clearInterval(interval);
      } else if (progress.done) {
        setUrl(progress.outputFile);
        setStatus("done");
        clearInterval(interval);
      }
      setProgress(progress.overallProgress);
    }, 1000);
  };
  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 text-center">
        {progress !== null && (
          <progress
            value={progress}
            className="h-1 w-full rounded-full bg-gray-200 text-red-500"
            max={1}
          />
        )}
        {/* Todo video */}
        <select
          value={framework}
          className="rounded-md border bg-transparent p-2 px-4"
          onChange={(e) => setFramework(e.target.value)}
        >
          {FRAMEWORKS.map((f) => (
            <option value={f}>{f}</option>
          ))}
        </select>
        <input
          className="w-full rounded-md border bg-transparent p-0 px-4"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <button
          className="rounded-md bg-blue-500 p-2 px-4 text-white"
          disabled={status === "rendering"}
        >
          {status === "rendering" ? "Rendering..." : "Render Video"}
        </button>

        {status === "done" && url && (
          <a target="_blank" className="text-blue-500 underline" href={url}>
            Open Rendered Video
          </a>
        )}
        {status === "error" && <div className="text-red-500">Error</div>}
      </form>
    </div>
  );
};
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Highlight } from "@/lib/agent-processor";

export function SummaryHighlighter({
  summaryText,
  highlights,
  onLineSelect,
}: {
  summaryText: string;
  highlights: Highlight[];
  onLineSelect: (lineNumber: number, text: string) => void;
}) {
  const [showGrammar, setShowGrammar] = useState(true);
  const [showSpelling, setShowSpelling] = useState(true);
  const [showImprovement, setShowImprovement] = useState(true);

  const lines = summaryText.split("\n");

  const getLineHighlights = (lineNumber: number) => {
    return highlights.filter((h) => {
      if (h.lineNumber !== lineNumber) return false;
      if (h.type === "grammar" && !showGrammar) return false;
      if (h.type === "spelling" && !showSpelling) return false;
      if (h.type === "improvement" && !showImprovement) return false;
      return true;
    });
  };

  const getHighlightClass = (type: string) => {
    switch (type) {
      case "grammar":
        return "bg-yellow-200 border-l-4 border-yellow-500";
      case "spelling":
        return "bg-red-200 border-l-4 border-red-500";
      case "improvement":
        return "bg-blue-200 border-l-4 border-blue-500";
      default:
        return "";
    }
  };

  const grammarCount = highlights.filter((h) => h.type === "grammar").length;
  const spellingCount = highlights.filter((h) => h.type === "spelling").length;
  const improvementCount = highlights.filter(
    (h) => h.type === "improvement"
  ).length;

  return (
    <div className="space-y-4">
      {/* Toggle Controls */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Highlight Filters</h3>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={showGrammar ? "default" : "outline"}
            onClick={() => setShowGrammar(!showGrammar)}
            className={`${
              showGrammar ? "bg-yellow-500 hover:bg-yellow-600" : ""
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full mr-2 ${
                showGrammar ? "bg-yellow-300" : "bg-gray-300"
              }`}
            />
            Grammar
            <Badge className="ml-2" variant="secondary">
              {grammarCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={showSpelling ? "default" : "outline"}
            onClick={() => setShowSpelling(!showSpelling)}
            className={`${
              showSpelling ? "bg-red-500 hover:bg-red-600" : ""
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full mr-2 ${
                showSpelling ? "bg-red-300" : "bg-gray-300"
              }`}
            />
            Spelling
            <Badge className="ml-2" variant="secondary">
              {spellingCount}
            </Badge>
          </Button>

          <Button
            size="sm"
            variant={showImprovement ? "default" : "outline"}
            onClick={() => setShowImprovement(!showImprovement)}
            className={`${
              showImprovement ? "bg-blue-500 hover:bg-blue-600" : ""
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full mr-2 ${
                showImprovement ? "bg-blue-300" : "bg-gray-300"
              }`}
            />
            Improvements
            <Badge className="ml-2" variant="secondary">
              {improvementCount}
            </Badge>
          </Button>
        </div>
      </Card>

      {/* Summary Text with Highlights */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Summary (Click line to edit)</h3>
        <div className="space-y-1 font-mono text-sm">
          {lines.map((line, index) => {
            const lineHighlights = getLineHighlights(index);
            const hasHighlight = lineHighlights.length > 0;
            const primaryHighlight = lineHighlights[0];

            return (
              <div
                key={index}
                className={`
                  p-3 rounded cursor-pointer transition-all
                  ${
                    hasHighlight
                      ? getHighlightClass(primaryHighlight.type)
                      : "hover:bg-gray-50"
                  }
                `}
                onClick={() => onLineSelect(index, line)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 select-none font-bold min-w-[3ch]">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900">{line || " "}</p>
                    {hasHighlight && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {lineHighlights.map((h, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs"
                          >
                            {h.type}: {h.issue}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
import * as vscode from "vscode";
import fetch from "node-fetch";

let lastTypedTime = Date.now();
let pauseCount = 0;
let backspaceCount = 0;

export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 EmotionAI extension is now active!");
  vscode.workspace.onDidChangeTextDocument((e) => {
    const now = Date.now();
    const delta = now - lastTypedTime;

    if (delta > 1000) {
      pauseCount++;
    }
    lastTypedTime = now;

    const changes = e.contentChanges;
    for (const change of changes) {
      if (change.text === "" && change.rangeLength === 1) {
        backspaceCount++;
      }
    }

    const frustrationScore = calculateFrustration(pauseCount, backspaceCount);
    if (frustrationScore > 0.7) {
      showHelpSuggestion();
    }
  });
}
function calculateFrustration(pauses: number, backspaces: number): number {
  const pauseScore = Math.min(pauses / 5, 1.0);
  const backspaceScore = Math.min(backspaces / 10, 1.0);
  return (pauseScore + backspaceScore) / 2;
}
function showHelpSuggestion() {
  vscode.window
    .showInformationMessage(
      "You seem stuck. Want help with this block?",
      "Yes",
      "No"
    )
    .then((selection) => {
      if (selection === "Yes") {
        triggerGPTAssistance();
      }
    });
}

async function triggerGPTAssistance() {
  const editor = vscode.window.activeTextEditor;
  const code = editor?.document.getText(editor.selection);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer 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`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful AI coding assistant." },
        { role: "user", content: `Please help with this code:\n\n${code}` },
      ],
    }),
  });

  const data = await res.json();
  vscode.window.showInformationMessage(data.choices[0].message.content);
}

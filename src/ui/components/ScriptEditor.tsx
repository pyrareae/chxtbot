"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/src/ui/components/button";
import { Input } from "@/src/ui/components/input";
import { Textarea } from "@/src/ui/components/textarea";
import { Label } from "@/src/ui/components/label";
import { Card, CardContent } from "@/src/ui/components/card";
import { useMediaQuery } from "@/src/hooks/use-mobile";
import { Terminal, Save, ArrowLeft, Trash2, Power } from "lucide-react";
import { toast } from "@/src/hooks/use-toast";
import { Switch } from "@/src/ui/components/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/components/alert-dialog";

interface Command {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const template =
`function run(arg) {
  return "Hello World"
}`

export default function ScriptEditor() {
  const [scriptContent, setScriptContent] = useState(template);
  const [commandName, setCommandName] = useState("");
  const [description, setDescription] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [testInput, setTestInput] = useState("");
  const [commandId, setCommandId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get the command ID from the URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("id");
    if (id) {
      fetchCommand(parseInt(id));
    }
  }, []);

  const fetchCommand = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/commands/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch command");
      }
      const data: Command = await response.json();

      setCommandId(data.id);
      setCommandName(data.name);
      setScriptContent(data.code || "// Write your script here\n");
      setDescription(data.description || "");
      setIsActive(data.isActive);
    } catch (error) {
      console.error("Error fetching command:", error);
      toast({
        title: "Error",
        description: "Failed to load command",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!commandName.trim()) {
      toast({
        title: "Error",
        description: "Command name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const method = commandId ? "PUT" : "POST";
      const url = commandId ? `/api/commands/${commandId}` : "/api/commands";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: commandName,
          code: scriptContent,
          description,
          isActive,
          userId: 1, // Default user ID
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${commandId ? "update" : "create"} command`);
      }

      const data = await response.json();

      if (!commandId) {
        setCommandId(data.id);
      }

      toast({
        title: "Success",
        description: `Command ${
          commandId ? "updated" : "created"
        } successfully`,
      });

      // Navigate back to command list after successful save
      window.location.href = "/commands";
    } catch (error) {
      console.error("Error saving command:", error);
      toast({
        title: "Error",
        description: `Failed to ${commandId ? "update" : "create"} command`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!scriptContent.trim()) {
      toast({
        title: "Error",
        description: "Script content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTestLoading(true);

      const response = await fetch("/api/commands/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: scriptContent,
          argument: testInput || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Test failed");
      }

      const data = await response.json();

      setTestResult(
        `Test completed successfully!\nInput: ${
          testInput || "(none)"
        }\nOutput: ${data.result || "No output"}`
      );
    } catch (error) {
      console.error("Error testing script:", error);
      setTestResult(
        `Test failed! Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!commandId) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/commands/${commandId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete command");
      }
      
      toast({
        title: "Success",
        description: "Command deleted successfully",
      });
      
      // Navigate back to command list
      window.location.href = "/commands";
    } catch (error) {
      console.error("Error deleting command:", error);
      toast({
        title: "Error",
        description: "Failed to delete command",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-black text-white">
      <div className="flex gap-4 mb-4">
        <Button
          variant="outline"
          className="hover:bg-gray-800"
          onClick={() => window.location.href = "/"}
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-blue-400">Edit Command</h1>
      </div>

      <Card className="bg-black border shadow-none">
        <CardContent
          className={`p-6 ${
            isDesktop ? "grid grid-cols-12 gap-6" : "space-y-6"
          }`}
        >
          {/* Editor - on the left side */}
          <div className={isDesktop ? "col-span-8" : ""}>
            <Label htmlFor="script-editor" className="block mb-2">
              Script
            </Label>
            <div
              className="rounded-md overflow-hidden"
              style={{ height: "400px" }}
            >
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={scriptContent}
                onChange={(value: string | undefined) =>
                  setScriptContent(value || "")
                }
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  tabSize: 2,
                  lineNumbers: "on",
                  lineDecorationsWidth: 0,
                  renderLineHighlight: "all",
                  scrollbar: {
                    vertical: "hidden",
                    horizontal: "hidden",
                  },
                }}
              />
            </div>
          </div>

          {/* Sidebar - on the right side */}
          <div className={isDesktop ? "col-span-4 space-y-4" : "space-y-4"}>
            <div className="space-y-2">
              <Label htmlFor="command-name">Command Name</Label>
              <Input
                id="command-name"
                placeholder="Enter command name"
                value={commandName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCommandName(e.target.value)
                }
                className="bg-[#222] border-0 text-white placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter script description"
                className="min-h-[100px] resize-none bg-[#222] border-0 text-white placeholder-gray-500"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            {/* Test Section */}
            <div className="space-y-2">
              <Label htmlFor="test">Test Script</Label>
              <Input
                id="test-input"
                placeholder="Enter test parameters"
                value={testInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTestInput(e.target.value)
                }
                className="bg-[#222] border-0 text-white placeholder-gray-500 mb-2"
              />
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-[#222] border-0 text-white hover:bg-[#333]"
                  onClick={handleTest}
                  disabled={isTestLoading}
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  {isTestLoading ? "Running..." : "Run Test"}
                </Button>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div className="mt-2 p-3 bg-[#222] rounded-md font-mono text-sm overflow-auto max-h-[150px]">
                  {testResult.split("\n").map((line: string, i: number) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4 bg-white text-black hover:bg-gray-200"
              onClick={handleSave}
              variant="default"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Script"}
            </Button>
            
            {/* Enable/Disable and Delete buttons */}
            {commandId && (
              <div className="flex items-center justify-end gap-2 mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    className={isActive ? "bg-green-600 hover:bg-green-700" : "text-gray-400 hover:text-white"}
                    onClick={() => setIsActive(!isActive)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {isActive ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#222] border-0 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the script "{commandName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#333] text-white border-0 hover:bg-[#444]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

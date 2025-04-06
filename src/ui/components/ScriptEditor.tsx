"use client"

import React, { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/src/shadcn/ui/button"
import { Input } from "@/src/shadcn/ui/input"
import { Textarea } from "@/src/shadcn/ui/textarea"
import { Label } from "@/src/shadcn/ui/label"
import { Card, CardContent } from "@/src/shadcn/ui/card"
import { useMediaQuery } from "@/src/hooks/use-mobile"
import { Terminal, Save, ArrowLeft } from "lucide-react"
import { toast } from "@/src/hooks/use-toast"

interface Command {
  id: number
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ScriptEditor() {
  const [scriptContent, setScriptContent] = useState("// Write your script here\n")
  const [commandName, setCommandName] = useState("")
  const [description, setDescription] = useState("")
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [testInput, setTestInput] = useState("")
  const [commandId, setCommandId] = useState<number | null>(null)
  
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
      setIsLoading(true)
      const response = await fetch(`/api/commands/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch command")
      }
      const data: Command = await response.json()
      
      setCommandId(data.id)
      setCommandName(data.name)
      setScriptContent(data.code || "// Write your script here\n")
    } catch (error) {
      console.error("Error fetching command:", error)
      toast({
        title: "Error",
        description: "Failed to load command",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!commandName.trim()) {
      toast({
        title: "Error",
        description: "Command name is required",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      const method = commandId ? "PUT" : "POST"
      const url = commandId ? `/api/commands/${commandId}` : "/api/commands"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: commandName,
          code: scriptContent,
          isActive: true,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${commandId ? "update" : "create"} command`)
      }
      
      const data = await response.json()
      
      if (!commandId) {
        setCommandId(data.id)
      }
      
      toast({
        title: "Success",
        description: `Command ${commandId ? "updated" : "created"} successfully`,
      })
      
      // Navigate back to command list after successful save
      window.location.href = "/commands"
    } catch (error) {
      console.error("Error saving command:", error)
      toast({
        title: "Error",
        description: `Failed to ${commandId ? "update" : "create"} command`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!scriptContent.trim()) {
      toast({
        title: "Error",
        description: "Script content is required",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsTestLoading(true)
      
      const response = await fetch("/api/commands/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: scriptContent,
          argument: testInput || "",
        }),
      })
      
      if (!response.ok) {
        throw new Error("Test failed")
      }
      
      const data = await response.json()
      
      setTestResult(`Test completed successfully!\nInput: ${testInput || "(none)"}\nOutput: ${data.result || "No output"}`)
    } catch (error) {
      console.error("Error testing script:", error)
      setTestResult(`Test failed! Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsTestLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold text-blue-400 mb-6">Script Manager</h1>

      <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
        <Card className="bg-black border-0 shadow-none">
          <CardContent className={`p-6 ${isDesktop ? "grid grid-cols-12 gap-6" : "space-y-6"}`}>
            {/* Editor - on the left side */}
            <div className={isDesktop ? "col-span-8" : ""}>
              <Label htmlFor="script-editor" className="block mb-2">
                Script
              </Label>
              <div className="rounded-md overflow-hidden" style={{ height: "400px" }}>
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  value={scriptContent}
                  onChange={(value: string | undefined) => setScriptContent(value || "")}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommandName(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
              </div>

              {/* Test Section */}
              <div className="space-y-2">
                <Label htmlFor="test">Test Script</Label>
                <Input
                  id="test-input"
                  placeholder="Enter test parameters"
                  value={testInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestInput(e.target.value)}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
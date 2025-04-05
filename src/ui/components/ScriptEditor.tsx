"use client"

import React, { useState, useEffect } from "react"
import Editor from "@monaco-editor/react"
import { Button } from "@/src/shadcn/ui/button"
import { Input } from "@/src/shadcn/ui/input"
import { Textarea } from "@/src/shadcn/ui/textarea"
import { Label } from "@/src/shadcn/ui/label"
import { Card, CardContent } from "@/src/shadcn/ui/card"
import { useMediaQuery } from "../../hooks/use-mobile"
import { Terminal, Save, ArrowLeft } from "lucide-react"
import { toast } from "../../hooks/use-toast"

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
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-background text-foreground min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = "/commands"} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{commandId ? "Edit Command" : "Create Command"}</h1>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className={`p-6 ${isDesktop ? "grid grid-cols-3 gap-6" : "space-y-6"}`}>
          {/* Editor - Now on the left side */}
          <div className={isDesktop ? "col-span-2" : ""}>
            <Label htmlFor="script-editor" className="block mb-2">
              Script
            </Label>
            <div className="border border-border rounded-md overflow-hidden" style={{ height: "400px" }}>
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
                }}
              />
            </div>
          </div>

          {/* Sidebar - Now on the right side */}
          <div className={isDesktop ? "col-span-1 space-y-4" : "space-y-4"}>
            <div className="space-y-2">
              <Label htmlFor="command-name">Command Name</Label>
              <Input
                id="command-name"
                placeholder="Enter command name"
                value={commandName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommandName(e.target.value)}
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter script description"
                className="min-h-[100px] resize-none bg-input"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              />
            </div>

            {/* New Test Section */}
            <div className="space-y-2">
              <Label htmlFor="test">Test Script</Label>
              <Input
                id="test-input"
                placeholder="Enter test parameters"
                value={testInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestInput(e.target.value)}
                className="bg-input mb-2"
              />
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-input" 
                  onClick={handleTest} 
                  disabled={isTestLoading}
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  {isTestLoading ? "Running..." : "Run Test"}
                </Button>
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm overflow-auto max-h-[150px]">
                  {testResult.split("\n").map((line: string, i: number) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={handleSave} 
              variant="default"
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Command"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
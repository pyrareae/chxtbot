"use client"

import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/shadcn/ui/table"
import { Button } from "@/src/shadcn/ui/button"
import { Input } from "@/src/shadcn/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shadcn/ui/card"
import { Badge } from "@/src/shadcn/ui/badge"
import { Edit, Search, Plus, AlertCircle } from "lucide-react"
import { toast } from "@/src/hooks/use-toast"

// Types from the backend
interface Command {
  id: number
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CommandsView() {
  const [commands, setCommands] = useState<Command[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCommands()
  }, [])

  const fetchCommands = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/commands")
      if (!response.ok) {
        throw new Error("Failed to fetch commands")
      }
      const data = await response.json()
      setCommands(data)
    } catch (error) {
      console.error("Error fetching commands:", error)
      toast({
        title: "Error",
        description: "Failed to load commands",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCommands = commands.filter(
    (cmd: Command) =>
      cmd.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (commandId: number) => {
    // Open the script editor
    window.location.href = `/script-editor?id=${commandId}`
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" 
      : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
  }

  return (
    <div className="container mx-auto p-4 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Command List</h1>
        <Button onClick={() => window.location.href = "/script-editor"}>
          <Plus className="mr-2 h-4 w-4" />
          New Command
        </Button>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Available Commands</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                className="pl-8 bg-input"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Command</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command: Command) => (
                    <TableRow key={command.id}>
                      <TableCell className="font-medium">{command.name}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(command.isActive)}`}>
                          {command.isActive ? "Enabled" : "Disabled"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(command.id)}
                          title="Edit command"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-10 w-10 mb-2 text-muted-foreground" />
                        {searchQuery ? (
                          <>No commands found. Try a different search.</>
                        ) : (
                          <>No commands found. Create your first command by clicking "New Command".</>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
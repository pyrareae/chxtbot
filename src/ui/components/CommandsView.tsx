"use client"

import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/shadcn/ui/table"
import { Button } from "@/src/shadcn/ui/button"
import { Input } from "@/src/shadcn/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/shadcn/ui/card"
import { Badge } from "@/src/shadcn/ui/badge"
import { MoreVertical, Play, Edit, Trash2, Search, Plus, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/shadcn/ui/dropdown-menu"
import { toast } from "@/src/hooks/use-toast"

// Types from the backend
interface Command {
  id: number
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastRun?: string
  status?: "success" | "failed" | "running" | "idle"
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
      
      // Transform the data to include status and lastRun properties
      const transformedData = data.map((cmd: Command) => ({
        ...cmd,
        lastRun: cmd.updatedAt ? new Date(cmd.updatedAt).toLocaleDateString() : "Never",
        status: cmd.isActive ? "idle" : "disabled"
      }))
      
      setCommands(transformedData)
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

  const handleRun = async (commandId: number) => {
    try {
      // Update the local state to show the command is running
      setCommands((prevCommands: Command[]) => 
        prevCommands.map((cmd: Command) => 
          cmd.id === commandId ? { ...cmd, status: "running" } : cmd
        )
      )

      const response = await fetch(`/api/commands/${commandId}/run`, {
        method: "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to run command")
      }
      
      // Update the command status to success after successful execution
      setCommands((prevCommands: Command[]) => 
        prevCommands.map((cmd: Command) => 
          cmd.id === commandId ? { ...cmd, status: "success", lastRun: new Date().toLocaleDateString() } : cmd
        )
      )
      
      toast({
        title: "Success",
        description: "Command executed successfully",
      })
    } catch (error) {
      console.error("Error running command:", error)
      
      // Update the command status to failed after failed execution
      setCommands((prevCommands: Command[]) => 
        prevCommands.map((cmd: Command) => 
          cmd.id === commandId ? { ...cmd, status: "failed" } : cmd
        )
      )
      
      toast({
        title: "Error",
        description: "Failed to run command",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (commandId: number) => {
    try {
      const response = await fetch(`/api/commands/${commandId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete command")
      }
      
      // Remove the command from the list
      setCommands(commands.filter((cmd: Command) => cmd.id !== commandId))
      
      toast({
        title: "Success",
        description: "Command deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting command:", error)
      toast({
        title: "Error",
        description: "Failed to delete command",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-500 hover:bg-green-500/30"
      case "failed":
        return "bg-red-500/20 text-red-500 hover:bg-red-500/30"
      case "running":
        return "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
      case "disabled":
        return "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
    }
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
                  <TableHead className="hidden md:table-cell">Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command: Command) => (
                    <TableRow key={command.id}>
                      <TableCell className="font-medium">{command.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{command.lastRun}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(command.status || "idle")}>
                          {command.status || "idle"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleRun(command.id)} title="Run command">
                            <Play className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(command.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(command.id)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
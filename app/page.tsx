"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Plus,
  Check,
  X,
  Edit,
  Save,
  Calendar,
  Search,
  Clock,
  BarChart2,
  SortAsc,
  ChevronDown,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

type Priority = "low" | "medium" | "high"
type SortOption = "createdAt" | "dueDate" | "priority" | "alphabetical"

interface Task {
  id: number
  text: string
  completed: boolean
  editing: boolean
  createdAt: string
  completedAt?: string
  priority: Priority
  dueDate?: string
  notes?: string
  showNotes?: boolean
}

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("tasks")
      return savedTasks ? JSON.parse(savedTasks) : []
    }
    return []
  })

  const [newTask, setNewTask] = useState("")
  const [editText, setEditText] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined)
  const [newTaskNotes, setNewTaskNotes] = useState("")
  const [editPriority, setEditPriority] = useState<Priority>("medium")
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(undefined)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }, [])

  const formatShortDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd MMM yyyy", { locale: tr })
  }, [])

  const getDueDateStatus = useCallback((dueDate?: string) => {
    if (!dueDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "overdue"
    if (diffDays === 0) return "today"
    if (diffDays <= 2) return "soon"
    return "future"
  }, [])

  const getPriorityColor = useCallback((priority: Priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }, [])

  const getPriorityText = useCallback((priority: Priority) => {
    switch (priority) {
      case "high":
        return "Yüksek"
      case "medium":
        return "Orta"
      case "low":
        return "Düşük"
      default:
        return "Belirsiz"
    }
  }, [])

  const getDueDateColor = useCallback((status: string | null) => {
    switch (status) {
      case "overdue":
        return "text-red-500"
      case "today":
        return "text-yellow-500"
      case "soon":
        return "text-orange-500"
      default:
        return "text-gray-400"
    }
  }, [])

  const getDueDateText = useCallback(
    (status: string | null, dueDate?: string) => {
      if (!dueDate) return ""

      switch (status) {
        case "overdue":
          return `Gecikmiş (${formatShortDate(dueDate)})`
        case "today":
          return "Bugün"
        case "soon":
          return `Yakında (${formatShortDate(dueDate)})`
        default:
          return formatShortDate(dueDate)
      }
    },
    [formatShortDate],
  )

  const addTask = useCallback(() => {
    if (newTask.trim() !== "") {
      const task: Task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        editing: false,
        createdAt: new Date().toISOString(),
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? newTaskDueDate.toISOString() : undefined,
        notes: newTaskNotes.trim() !== "" ? newTaskNotes : undefined,
      }
      setTasks((prev) => [...prev, task])
      setNewTask("")
      setNewTaskPriority("medium")
      setNewTaskDueDate(undefined)
      setNewTaskNotes("")
    }
  }, [newTask, newTaskPriority, newTaskDueDate, newTaskNotes])

  const toggleComplete = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined,
          }
        }
        return task
      }),
    )
  }, [])

  const startEdit = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          setEditText(task.text)
          setEditNotes(task.notes || "")
          setEditPriority(task.priority)
          setEditDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
          return { ...task, editing: true }
        }
        return { ...task, editing: false }
      }),
    )
  }, [])

  const saveEdit = useCallback(
    (id: number) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === id) {
            return {
              ...task,
              text: editText,
              notes: editNotes.trim() !== "" ? editNotes : undefined,
              priority: editPriority,
              dueDate: editDueDate ? editDueDate.toISOString() : undefined,
              editing: false,
            }
          }
          return task
        }),
      )
    },
    [editText, editNotes, editPriority, editDueDate],
  )

  const cancelEdit = useCallback((id: number) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, editing: false } : task)))
  }, [])

  const deleteTask = useCallback((id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const toggleNotes = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          return { ...task, showNotes: !task.showNotes }
        }
        return task
      }),
    )
  }, [])

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
  }, [])

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const searchLower = searchQuery.toLowerCase()
      const textMatch = task.text.toLowerCase().includes(searchLower)
      const notesMatch = task.notes ? task.notes.toLowerCase().includes(searchLower) : false
      return textMatch || notesMatch
    })

    return filtered.sort((a, b) => {
      let comparison = 0

      switch (sortOption) {
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0
          else if (!a.dueDate) comparison = 1
          else if (!b.dueDate) comparison = -1
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority]
          break
        case "alphabetical":
          comparison = a.text.localeCompare(b.text, "tr")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [tasks, searchQuery, sortOption, sortDirection])

  const pendingTasks = useMemo(() => filteredAndSortedTasks.filter((task) => !task.completed), [filteredAndSortedTasks])

  const completedTasks = useMemo(
    () => filteredAndSortedTasks.filter((task) => task.completed),
    [filteredAndSortedTasks],
  )

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const completedTasksCount = tasks.filter((task) => task.completed).length
    const pendingTasksCount = totalTasks - completedTasksCount

    const completionRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0

    let avgCompletionTime = 0
    const completedWithTime = tasks.filter((task) => task.completed && task.completedAt)

    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, task) => {
        const created = new Date(task.createdAt).getTime()
        const completed = new Date(task.completedAt!).getTime()
        return sum + (completed - created)
      }, 0)

      avgCompletionTime = totalTime / completedWithTime.length / (1000 * 60 * 60 * 24)
    }

    const priorityDistribution = {
      high: tasks.filter((task) => task.priority === "high").length,
      medium: tasks.filter((task) => task.priority === "medium").length,
      low: tasks.filter((task) => task.priority === "low").length,
    }

    const overdueTasksCount = tasks.filter((task) => {
      if (!task.completed && task.dueDate) {
        return getDueDateStatus(task.dueDate) === "overdue"
      }
      return false
    }).length

    return {
      totalTasks,
      completedTasksCount,
      pendingTasksCount,
      completionRate,
      avgCompletionTime,
      priorityDistribution,
      overdueTasksCount,
    }
  }, [tasks, getDueDateStatus])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-center">İş Listesi</h1>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowStats(!showStats)}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
            title="İstatistikler"
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
        </div>

        {showStats && (
          <Card className="bg-gray-800 border-gray-700 text-white mb-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                İstatistikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Toplam Görev</div>
                  <div className="text-2xl font-bold">{stats.totalTasks}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Tamamlanan</div>
                  <div className="text-2xl font-bold">{stats.completedTasksCount}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Bekleyen</div>
                  <div className="text-2xl font-bold">{stats.pendingTasksCount}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400">Gecikmiş</div>
                  <div className="text-2xl font-bold">{stats.overdueTasksCount}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Tamamlanma Oranı</span>
                    <span className="text-sm font-medium">{stats.completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-1">Öncelik Dağılımı</div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-400">Düşük</div>
                      <div className="font-bold">{stats.priorityDistribution.low}</div>
                    </div>
                    <div className="flex-1 bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-400">Orta</div>
                      <div className="font-bold">{stats.priorityDistribution.medium}</div>
                    </div>
                    <div className="flex-1 bg-gray-700 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-400">Yüksek</div>
                      <div className="font-bold">{stats.priorityDistribution.high}</div>
                    </div>
                  </div>
                </div>

                {stats.avgCompletionTime > 0 && (
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Ortalama Tamamlanma Süresi</div>
                    <div className="font-bold">{stats.avgCompletionTime.toFixed(1)} gün</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Görevlerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="createdAt">Eklenme Tarihi</SelectItem>
                <SelectItem value="dueDate">Son Tarih</SelectItem>
                <SelectItem value="priority">Öncelik</SelectItem>
                <SelectItem value="alphabetical">Alfabetik</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleSortDirection}
              className="bg-gray-800 border-gray-700 text-white"
            >
              {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700 text-white mb-6">
          <CardHeader>
            <CardTitle>Yeni Görev Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Input
                  type="text"
                  placeholder="Görev başlığı..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      addTask()
                    }
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />

                <Textarea
                  placeholder="Görev notları (opsiyonel)..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-sm text-gray-400 mb-1 block">Öncelik</label>
                  <Select value={newTaskPriority} onValueChange={(value) => setNewTaskPriority(value as Priority)}>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Öncelik seçin" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="low">Düşük</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label className="text-sm text-gray-400 mb-1 block">Son Tarih (Opsiyonel)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white ${
                          !newTaskDueDate && "text-gray-400"
                        }`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newTaskDueDate ? format(newTaskDueDate, "dd MMM yyyy", { locale: tr }) : "Tarih seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                      <CalendarComponent
                        mode="single"
                        selected={newTaskDueDate}
                        onSelect={setNewTaskDueDate}
                        initialFocus
                        className="bg-gray-800 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                onClick={addTask}
                className="w-full bg-white text-gray-900 hover:bg-gray-200"
                disabled={newTask.trim() === ""}
              >
                <Plus className="mr-2 h-4 w-4" /> Görev Ekle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="todo">Yapılacaklar</TabsTrigger>
            <TabsTrigger value="done">Yapılanlar</TabsTrigger>
            <TabsTrigger value="all">Tümü</TabsTrigger>
          </TabsList>

          <TabsContent value="todo">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Yapılacaklar</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingTasks.length === 0 ? (
                  <p className="text-center text-gray-400">
                    {searchQuery ? "Arama kriterine uygun yapılacak görev bulunamadı" : "Yapılacak görev yok"}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {pendingTasks.map((task) => (
                      <li key={task.id} className="flex flex-col p-3 rounded-lg bg-gray-700">
                        {task.editing ? (
                          <div className="flex flex-col space-y-3">
                            <Input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                              className="bg-gray-800 border-gray-700 text-white"
                            />

                            <Textarea
                              placeholder="Görev notları (opsiyonel)..."
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                            />

                            <div className="flex flex-wrap gap-4">
                              <div className="flex-1 min-w-[140px]">
                                <label className="text-sm text-gray-400 mb-1 block">Öncelik</label>
                                <Select
                                  value={editPriority}
                                  onValueChange={(value) => setEditPriority(value as Priority)}
                                >
                                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                                    <SelectValue placeholder="Öncelik seçin" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="low">Düşük</SelectItem>
                                    <SelectItem value="medium">Orta</SelectItem>
                                    <SelectItem value="high">Yüksek</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex-1 min-w-[140px]">
                                <label className="text-sm text-gray-400 mb-1 block">Son Tarih (Opsiyonel)</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={`w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white ${
                                        !editDueDate && "text-gray-400"
                                      }`}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {editDueDate ? format(editDueDate, "dd MMM yyyy", { locale: tr }) : "Tarih seçin"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                                    <CalendarComponent
                                      mode="single"
                                      selected={editDueDate}
                                      onSelect={setEditDueDate}
                                      initialFocus
                                      className="bg-gray-800 text-white"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                variant="outline"
                                onClick={() => cancelEdit(task.id)}
                                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                              >
                                <X className="mr-2 h-4 w-4" /> İptal
                              </Button>
                              <Button
                                onClick={() => saveEdit(task.id)}
                                className="bg-white text-gray-900 hover:bg-gray-200"
                              >
                                <Save className="mr-2 h-4 w-4" /> Kaydet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => toggleComplete(task.id)}
                                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <div>
                                  <span className="flex items-center">
                                    {task.text}
                                    <Badge
                                      variant="outline"
                                      className={`ml-2 ${getPriorityColor(task.priority)} text-white`}
                                    >
                                      {getPriorityText(task.priority)}
                                    </Badge>
                                  </span>

                                  {task.dueDate && (
                                    <div
                                      className={`text-xs flex items-center mt-1 ${getDueDateColor(getDueDateStatus(task.dueDate))}`}
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      {getDueDateText(getDueDateStatus(task.dueDate), task.dueDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                {task.notes && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => toggleNotes(task.id)}
                                    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => startEdit(task.id)}
                                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => deleteTask(task.id)}
                                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {task.showNotes && task.notes && (
                              <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300">{task.notes}</div>
                            )}

                            <div className="flex items-center mt-2 text-xs text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Eklenme: {formatDate(task.createdAt)}</span>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Yapılanlar</CardTitle>
              </CardHeader>
              <CardContent>
                {completedTasks.length === 0 ? (
                  <p className="text-center text-gray-400">
                    {searchQuery ? "Arama kriterine uygun tamamlanmış görev bulunamadı" : "Tamamlanmış görev yok"}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {completedTasks.map((task) => (
                      <li key={task.id} className="flex flex-col p-3 rounded-lg bg-gray-700">
                        <div className="flex items-center justify-between line-through">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => toggleComplete(task.id)}
                              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div>
                              <span className="flex items-center text-gray-400">
                                {task.text}
                                <Badge
                                  variant="outline"
                                  className={`ml-2 opacity-50 ${getPriorityColor(task.priority)} text-white`}
                                >
                                  {getPriorityText(task.priority)}
                                </Badge>
                              </span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => deleteTask(task.id)}
                            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {task.notes && task.showNotes && (
                          <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-400 line-through">
                            {task.notes}
                          </div>
                        )}

                        {task.notes && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleNotes(task.id)}
                            className="mt-1 h-6 text-xs text-gray-400 hover:text-white hover:bg-transparent"
                          >
                            {task.showNotes ? "Notları gizle" : "Notları göster"}
                          </Button>
                        )}

                        <div className="flex flex-col mt-2 text-xs">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Eklenme: {formatDate(task.createdAt)}</span>
                          </div>
                          {task.completedAt && (
                            <div className="flex items-center mt-1 text-gray-400">
                              <Check className="h-3 w-3 mr-1" />
                              <span>Tamamlanma: {formatDate(task.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Tüm Görevler</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAndSortedTasks.length === 0 ? (
                  <p className="text-center text-gray-400">
                    {searchQuery ? "Arama kriterine uygun görev bulunamadı" : "Henüz görev eklenmemiş"}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {filteredAndSortedTasks.map((task) => (
                      <li key={task.id} className="flex flex-col p-3 rounded-lg bg-gray-700">
                        {task.editing ? (
                          <div className="flex flex-col space-y-3">
                            <Input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                              className="bg-gray-800 border-gray-700 text-white"
                            />

                            <Textarea
                              placeholder="Görev notları (opsiyonel)..."
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
                            />

                            <div className="flex flex-wrap gap-4">
                              <div className="flex-1 min-w-[140px]">
                                <label className="text-sm text-gray-400 mb-1 block">Öncelik</label>
                                <Select
                                  value={editPriority}
                                  onValueChange={(value) => setEditPriority(value as Priority)}
                                >
                                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                                    <SelectValue placeholder="Öncelik seçin" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    <SelectItem value="low">Düşük</SelectItem>
                                    <SelectItem value="medium">Orta</SelectItem>
                                    <SelectItem value="high">Yüksek</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex-1 min-w-[140px]">
                                <label className="text-sm text-gray-400 mb-1 block">Son Tarih (Opsiyonel)</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={`w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white ${
                                        !editDueDate && "text-gray-400"
                                      }`}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {editDueDate ? format(editDueDate, "dd MMM yyyy", { locale: tr }) : "Tarih seçin"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                                    <CalendarComponent
                                      mode="single"
                                      selected={editDueDate}
                                      onSelect={setEditDueDate}
                                      initialFocus
                                      className="bg-gray-800 text-white"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                variant="outline"
                                onClick={() => cancelEdit(task.id)}
                                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                              >
                                <X className="mr-2 h-4 w-4" /> İptal
                              </Button>
                              <Button
                                onClick={() => saveEdit(task.id)}
                                className="bg-white text-gray-900 hover:bg-gray-200"
                              >
                                <Save className="mr-2 h-4 w-4" /> Kaydet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => toggleComplete(task.id)}
                                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                >
                                  {task.completed ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <div>
                                  <span
                                    className={`flex items-center ${task.completed ? "line-through text-gray-400" : ""}`}
                                  >
                                    {task.text}
                                    <Badge
                                      variant="outline"
                                      className={`ml-2 ${task.completed ? "opacity-50" : ""} ${getPriorityColor(task.priority)} text-white`}
                                    >
                                      {getPriorityText(task.priority)}
                                    </Badge>
                                  </span>

                                  {task.dueDate && !task.completed && (
                                    <div
                                      className={`text-xs flex items-center mt-1 ${getDueDateColor(getDueDateStatus(task.dueDate))}`}
                                    >
                                      <Clock className="h-3 w-3 mr-1" />
                                      {getDueDateText(getDueDateStatus(task.dueDate), task.dueDate)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                {task.notes && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => toggleNotes(task.id)}
                                    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                                {!task.completed && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => startEdit(task.id)}
                                    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => deleteTask(task.id)}
                                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-white"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {task.showNotes && task.notes && (
                              <div
                                className={`mt-2 p-2 bg-gray-800 rounded text-sm ${task.completed ? "text-gray-400 line-through" : "text-gray-300"}`}
                              >
                                {task.notes}
                              </div>
                            )}

                            <div className="flex flex-col mt-2 text-xs">
                              <div className="flex items-center text-gray-400">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Eklenme: {formatDate(task.createdAt)}</span>
                              </div>
                              {task.completed && task.completedAt && (
                                <div className="flex items-center mt-1 text-gray-400">
                                  <Check className="h-3 w-3 mr-1" />
                                  <span>Tamamlanma: {formatDate(task.completedAt)}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


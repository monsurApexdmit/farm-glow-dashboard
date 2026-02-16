import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon, Plus, Search, Download, Pencil, Trash2, ClipboardList, Clock,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
type TaskStatus = "Pending" | "In Progress" | "Completed" | "Overdue";
type TaskCategory = "Planting" | "Harvesting" | "Irrigation" | "Feeding" | "Maintenance" | "Veterinary" | "Other";

interface ScheduleTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  startDate: string;
}

const taskCategories: TaskCategory[] = ["Planting", "Harvesting", "Irrigation", "Feeding", "Maintenance", "Veterinary", "Other"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const statuses: TaskStatus[] = ["Pending", "In Progress", "Completed", "Overdue"];

const priorityBadge = (p: TaskPriority) => {
  const map: Record<TaskPriority, string> = {
    Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return <Badge variant="outline" className={map[p]}>{p}</Badge>;
};

const statusBadge = (s: TaskStatus) => {
  const map: Record<TaskStatus, string> = {
    Pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
};

const initialTasks: ScheduleTask[] = [
  { id: "1", title: "Plant corn in Field A", description: "Prepare soil and plant corn seeds", category: "Planting", priority: "High", status: "In Progress", assignee: "John", dueDate: "2026-02-20", startDate: "2026-02-10" },
  { id: "2", title: "Irrigate wheat fields", description: "Run irrigation system for wheat", category: "Irrigation", priority: "Medium", status: "Pending", assignee: "Sarah", dueDate: "2026-02-18", startDate: "2026-02-16" },
  { id: "3", title: "Feed livestock - morning", description: "Morning feeding for all cattle", category: "Feeding", priority: "High", status: "Completed", assignee: "Mike", dueDate: "2026-02-15", startDate: "2026-02-15" },
  { id: "4", title: "Tractor maintenance", description: "Oil change and filter replacement", category: "Maintenance", priority: "Low", status: "Pending", assignee: "Tom", dueDate: "2026-02-22", startDate: "2026-02-21" },
  { id: "5", title: "Vaccinate new calves", description: "Administer vaccines to new calves", category: "Veterinary", priority: "Urgent", status: "Overdue", assignee: "Dr. Smith", dueDate: "2026-02-12", startDate: "2026-02-11" },
  { id: "6", title: "Harvest tomatoes", description: "Harvest ripe tomatoes from greenhouse", category: "Harvesting", priority: "Medium", status: "Pending", assignee: "Lisa", dueDate: "2026-02-19", startDate: "2026-02-19" },
];

const emptyForm = (): Omit<ScheduleTask, "id"> => ({
  title: "", description: "", category: "Other", priority: "Medium", status: "Pending", assignee: "", dueDate: new Date().toISOString().split("T")[0], startDate: new Date().toISOString().split("T")[0],
});

export default function Schedule() {
  const [tasks, setTasks] = useState<ScheduleTask[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [form, setForm] = useState<Omit<ScheduleTask, "id">>(emptyForm());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.assignee.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || t.category === filterCategory;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchDate = !selectedDate || t.dueDate === format(selectedDate, "yyyy-MM-dd");
    return matchSearch && matchCategory && matchStatus && matchPriority && matchDate;
  });

  const openAdd = () => { setEditingTask(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (task: ScheduleTask) => { setEditingTask(task); const { id, ...rest } = task; setForm(rest); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...form } : t)));
    } else {
      setTasks((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) setTasks((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const exportCSV = () => {
    const headers = ["Title", "Category", "Priority", "Status", "Assignee", "Start Date", "Due Date"];
    const rows = filtered.map((t) => [t.title, t.category, t.priority, t.status, t.assignee, t.startDate, t.dueDate]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "schedule.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const pending = tasks.filter((t) => t.status === "Pending").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const overdue = tasks.filter((t) => t.status === "Overdue").length;

  // Dates with tasks for calendar highlighting
  const taskDates = tasks.map((t) => t.dueDate);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-8 h-8 text-primary" /> Farm Schedule
            </h1>
            <p className="text-muted-foreground mt-1">Plan and track farm tasks, activities, and deadlines</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />Export</Button>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />Add Task</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{pending}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4 text-blue-500" />In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{inProgress}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{completed}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{overdue}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-sm font-medium">Calendar</CardTitle></CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-0 pointer-events-auto"
                modifiers={{ hasTasks: taskDates.map((d) => new Date(d + "T00:00:00")) }}
                modifiersStyles={{ hasTasks: { fontWeight: "bold", textDecoration: "underline" } }}
              />
              {selectedDate && (
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedDate(undefined)}>
                  Clear date filter
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Filters + Table */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {taskCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      {priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />No tasks found</TableCell></TableRow>
                    ) : filtered.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground">{task.description}</div>
                        </TableCell>
                        <TableCell>{task.category}</TableCell>
                        <TableCell>{priorityBadge(task.priority)}</TableCell>
                        <TableCell>
                          <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">{statusBadge(task.status)}</SelectTrigger>
                            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{task.assignee}</TableCell>
                        <TableCell>{task.dueDate}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(task)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(task.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as TaskCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{taskCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Assignee</Label><Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingTask ? "Save Changes" : "Add Task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

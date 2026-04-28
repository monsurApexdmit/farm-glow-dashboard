import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
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
  Calendar as CalendarIcon, Plus, Search, Download, Pencil, Trash2, ClipboardList, Clock, Loader,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { scheduleService, BackendSchedule } from "@/services/schedule.service";
import { BackendWorker, workerService } from "@/services/worker.service";

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
  assigneeId: string;
  farmId: string;
  dueDate: string;
  startDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
}

interface ScheduleMeta {
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  startDate?: string;
  uiStatus?: TaskStatus;
}

const taskCategories: TaskCategory[] = ["Planting", "Harvesting", "Irrigation", "Feeding", "Maintenance", "Veterinary", "Other"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const statuses: TaskStatus[] = ["Pending", "In Progress", "Completed", "Overdue"];
const META_STORAGE_KEY = "schedule-page-meta:v1";

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

const todayString = () => new Date().toISOString().split("T")[0];

const emptyForm = (): Omit<ScheduleTask, "id"> => ({
  title: "",
  description: "",
  category: "Other",
  priority: "Medium",
  status: "Pending",
  assignee: "",
  assigneeId: "",
  farmId: "",
  dueDate: todayString(),
  startDate: todayString(),
  startTime: "08:00",
  endTime: "17:00",
  shiftType: "day",
});

const readScheduleMeta = (): Record<string, ScheduleMeta> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeScheduleMeta = (meta: Record<string, ScheduleMeta>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
};

const workerName = (worker?: Partial<BackendWorker> | { first_name?: string; last_name?: string; name?: string }) => {
  if (!worker) return "";
  if ("name" in worker && worker.name) return worker.name;
  const first = "first_name" in worker ? worker.first_name : "";
  const last = "last_name" in worker ? worker.last_name : "";
  return `${first || ""} ${last || ""}`.trim();
};

const inferCategory = (task: string): TaskCategory => {
  const value = task.toLowerCase();
  if (value.includes("plant")) return "Planting";
  if (value.includes("harvest")) return "Harvesting";
  if (value.includes("irrig")) return "Irrigation";
  if (value.includes("feed")) return "Feeding";
  if (value.includes("maint")) return "Maintenance";
  if (value.includes("vaccin") || value.includes("vet")) return "Veterinary";
  return "Other";
};

const inferPriority = (task: string): TaskPriority => {
  const value = task.toLowerCase();
  if (value.includes("urgent") || value.includes("asap")) return "Urgent";
  if (value.includes("critical") || value.includes("immediate")) return "High";
  return "Medium";
};

const mapBackendStatusToUi = (schedule: BackendSchedule, meta?: ScheduleMeta): TaskStatus => {
  if (meta?.uiStatus) return meta.uiStatus;
  if (schedule.status === "completed") return "Completed";
  const dueDate = (schedule.work_date || schedule.scheduled_date)?.split("T")[0] || todayString();
  if (schedule.status === "cancelled") return "Overdue";
  if (dueDate < todayString()) return "Overdue";
  return "Pending";
};

const mapUiStatusToBackend = (status: TaskStatus): BackendSchedule["status"] => {
  if (status === "Completed") return "completed";
  if (status === "Overdue") return "scheduled";
  return "scheduled";
};

const mapBackendToTask = (
  schedule: BackendSchedule,
  workersById: Record<string, BackendWorker>,
  meta: Record<string, ScheduleMeta>
): ScheduleTask => {
  const taskMeta = meta[schedule.id] || {};
  const worker = workersById[schedule.worker_id];
  const assignee = workerName(worker) || workerName(schedule.worker) || "Unassigned";
  const dueDate = (schedule.work_date || schedule.scheduled_date)?.split("T")[0] || todayString();
  return {
    id: String(schedule.id),
    title: schedule.task || "",
    description: taskMeta.description || "",
    category: taskMeta.category || inferCategory(schedule.task || ""),
    priority: taskMeta.priority || inferPriority(schedule.task || ""),
    status: mapBackendStatusToUi(schedule, taskMeta),
    assignee,
    assigneeId: String(schedule.worker_id || ""),
    farmId: String(schedule.farm_id || worker?.farm_id || ""),
    dueDate,
    startDate: taskMeta.startDate || dueDate,
    startTime: schedule.start_time?.slice(0, 5) || "08:00",
    endTime: schedule.end_time?.slice(0, 5) || "17:00",
    shiftType: schedule.shift_type || "day",
  };
};

export default function Schedule() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [workers, setWorkers] = useState<BackendWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [form, setForm] = useState<Omit<ScheduleTask, "id">>(emptyForm());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [taskMeta, setTaskMeta] = useState<Record<string, ScheduleMeta>>(() => readScheduleMeta());

  useEffect(() => {
    loadData();
  }, []);

  const persistMeta = (nextMeta: Record<string, ScheduleMeta>) => {
    setTaskMeta(nextMeta);
    writeScheduleMeta(nextMeta);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [scheduleData, workerData] = await Promise.all([
        scheduleService.getSchedules(),
        workerService.getWorkers(),
      ]);
      const safeWorkers = Array.isArray(workerData) ? workerData : [];
      const workersById = safeWorkers.reduce<Record<string, BackendWorker>>((acc, worker) => {
        acc[String(worker.id)] = worker;
        return acc;
      }, {});

      const meta = readScheduleMeta();
      const mapped = (Array.isArray(scheduleData) ? scheduleData : []).map((schedule) =>
        mapBackendToTask(schedule, workersById, meta)
      );

      setWorkers(safeWorkers);
      setTasks(mapped);
      setTaskMeta(meta);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load schedules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const workerOptions = useMemo(
    () =>
      workers.map((worker) => ({
        id: String(worker.id),
        label: workerName(worker) || worker.email || `Worker ${worker.id}`,
        farmId: String(worker.farm_id || ""),
      })),
    [workers]
  );

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const matchSearch =
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.assignee.toLowerCase().includes(search.toLowerCase());
        const matchCategory = filterCategory === "all" || task.category === filterCategory;
        const matchStatus = filterStatus === "all" || task.status === filterStatus;
        const matchPriority = filterPriority === "all" || task.priority === filterPriority;
        const matchDate = !selectedDate || task.dueDate === format(selectedDate, "yyyy-MM-dd");
        return matchSearch && matchCategory && matchStatus && matchPriority && matchDate;
      }),
    [tasks, search, filterCategory, filterStatus, filterPriority, selectedDate]
  );

  const openAdd = () => {
    setEditingTask(null);
    setForm({
      ...emptyForm(),
      assigneeId: workerOptions[0]?.id || "",
      assignee: workerOptions[0]?.label || "",
      farmId: workerOptions[0]?.farmId || "",
    });
    setDialogOpen(true);
  };

  const openEdit = (task: ScheduleTask) => {
    setEditingTask(task);
    const { id, ...rest } = task;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleWorkerChange = (workerId: string) => {
    const worker = workerOptions.find((item) => item.id === workerId);
    setForm((current) => ({
      ...current,
      assigneeId: workerId,
      assignee: worker?.label || "",
      farmId: worker?.farmId || "",
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.assigneeId || !form.farmId || !form.startTime || !form.endTime || !form.shiftType) {
      toast({
        title: "Missing fields",
        description: "Task, assignee, farm, times, and shift type are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<BackendSchedule> = {
        worker_id: form.assigneeId,
        farm_id: form.farmId,
        task: form.title.trim(),
        work_date: form.dueDate,
        scheduled_date: form.dueDate,
        start_time: form.startTime,
        end_time: form.endTime,
        shift_type: form.shiftType,
        status: mapUiStatusToBackend(form.status),
      };

      const saved = editingTask
        ? await scheduleService.updateSchedule(editingTask.id, payload)
        : await scheduleService.createSchedule(payload);

      const nextMeta = {
        ...taskMeta,
        [String(saved.id)]: {
          description: form.description,
          category: form.category,
          priority: form.priority,
          startDate: form.startDate,
          uiStatus: form.status,
        },
      };
      persistMeta(nextMeta);

      setDialogOpen(false);
      setEditingTask(null);
      setForm(emptyForm());
      toast({ title: editingTask ? "Task updated" : "Task added" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save schedule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await scheduleService.deleteSchedule(deleteId);
      const nextMeta = { ...taskMeta };
      delete nextMeta[deleteId];
      persistMeta(nextMeta);
      setDeleteId(null);
      toast({ title: "Task deleted" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const existing = tasks.find((task) => task.id === id);
    if (!existing) return;

    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));

    const nextMeta = {
      ...taskMeta,
      [id]: {
        ...(taskMeta[id] || {}),
        description: taskMeta[id]?.description ?? existing.description,
        category: taskMeta[id]?.category ?? existing.category,
        priority: taskMeta[id]?.priority ?? existing.priority,
        startDate: taskMeta[id]?.startDate ?? existing.startDate,
        uiStatus: status,
      },
    };
    persistMeta(nextMeta);

    try {
      await scheduleService.updateSchedule(id, { status: mapUiStatusToBackend(status) });
      toast({ title: "Task status updated" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
      await loadData();
    }
  };

  const exportCSV = () => {
    const headers = ["Title", "Category", "Priority", "Status", "Assignee", "Start Date", "Due Date"];
    const rows = filtered.map((task) => [task.title, task.category, task.priority, task.status, task.assignee, task.startDate, task.dueDate]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pending = tasks.filter((task) => task.status === "Pending").length;
  const inProgress = tasks.filter((task) => task.status === "In Progress").length;
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const overdue = tasks.filter((task) => task.status === "Overdue").length;
  const taskDates = tasks.map((task) => task.dueDate);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-4 h-4 text-blue-500" />In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{inProgress}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{completed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{overdue}</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm font-medium">Calendar</CardTitle></CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-0 pointer-events-auto"
              modifiers={{ hasTasks: taskDates.map((date) => new Date(date + "T00:00:00")) }}
              modifiersStyles={{ hasTasks: { fontWeight: "bold", textDecoration: "underline" } }}
            />
            {selectedDate && (
              <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedDate(undefined)}>
                Clear date filter
              </Button>
            )}
          </CardContent>
        </Card>

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
                    {taskCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
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
                        <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value as TaskStatus)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs">{statusBadge(task.status)}</SelectTrigger>
                          <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingTask(null);
          setForm(emptyForm());
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as TaskCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{taskCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as TaskPriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Assignee</Label>
                <Select value={form.assigneeId} onValueChange={handleWorkerChange}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>
                    {workerOptions.map((worker) => <SelectItem key={worker.id} value={worker.id}>{worker.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div><Label>End Time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              <div><Label>Shift Type</Label>
                <Select value={form.shiftType} onValueChange={(value) => setForm({ ...form, shiftType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{editingTask ? "Save Changes" : "Add Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </PageShell>
  );
}

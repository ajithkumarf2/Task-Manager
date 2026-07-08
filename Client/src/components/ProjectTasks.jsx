import { format } from "date-fns";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deleteTask, updateTask } from "../features/workspaceSlice";
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, XIcon, Zap, Pen, Trash } from "lucide-react";
import EditTaskDialog from "./EditTaskDialog";

const typeIcons = {
    BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
    FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
    TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
    IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
    OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
    LOW: { background: "bg-red-100 dark:bg-red-950", prioritycolor: "text-red-600 dark:text-red-400" },
    MEDIUM: { background: "bg-blue-100 dark:bg-blue-950", prioritycolor: "text-blue-600 dark:text-blue-400" },
    HIGH: { background: "bg-emerald-100 dark:bg-emerald-950", prioritycolor: "text-emerald-600 dark:text-emerald-400" },
};

const ProjectTasks = ({ tasks }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        status: "",
        type: "",
        priority: "",
        assignee: "",
    });

    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('id');

    const [showEditTask, setShowEditTask] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);

    const handleStartEdit = (task) => {
        setTaskToEdit(task);
        setShowEditTask(true);
    };

    const handleDeleteTask = async (taskId) => {
        const confirm = window.confirm("Are you sure you want to delete this task?");
        if (!confirm) return;
        toast.loading("Deleting task...");
        try {
            await dispatch(deleteTask([taskId])).unwrap();
            toast.dismissAll();
            toast.success("Task deleted successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.message || "Failed to delete task");
        }
    };

    const assigneeList = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))),
        [tasks]
    );

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const { status, type, priority, assignee } = filters;
            return (
                (!status || task.status === status) &&
                (!type || task.type === type) &&
                (!priority || task.priority === priority) &&
                (!assignee || task.assignee?.name === assignee)
            );
        });
    }, [filters, tasks]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            toast.loading("Updating status...");

            let updatedTask = structuredClone(tasks.find((t) => t.id === taskId));
            updatedTask.status = newStatus;
            await dispatch(updateTask(updatedTask)).unwrap();

            toast.dismissAll();
            toast.success("Task status updated successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message || "Failed to update status");
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                {["status", "type", "priority", "assignee"].map((name) => {
                    const options = {
                        status: [
                            { label: "All Statuses", value: "" },
                            { label: "To Do", value: "TODO" },
                            { label: "In Progress", value: "IN_PROGRESS" },
                            { label: "Done", value: "DONE" },
                        ],
                        type: [
                            { label: "All Types", value: "" },
                            { label: "Task", value: "TASK" },
                            { label: "Bug", value: "BUG" },
                            { label: "Feature", value: "FEATURE" },
                            { label: "Improvement", value: "IMPROVEMENT" },
                            { label: "Other", value: "OTHER" },
                        ],
                        priority: [
                            { label: "All Priorities", value: "" },
                            { label: "Low", value: "LOW" },
                            { label: "Medium", value: "MEDIUM" },
                            { label: "High", value: "HIGH" },
                        ],
                        assignee: [
                            { label: "All Assignees", value: "" },
                            ...assigneeList.map((n) => ({ label: n, value: n })),
                        ],
                    };
                    return (
                        <select key={name} name={name} value={filters[name]} onChange={handleFilterChange} className="px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-800 outline-none text-xs text-gray-500 dark:text-zinc-400 not-dark:bg-white dark:bg-zinc-900 cursor-pointer" >
                            {options[name].map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    );
                })}

                {/* Reset filters */}
                {(filters.status || filters.type || filters.priority || filters.assignee) && (
                    <button type="button" onClick={() => setFilters({ status: "", type: "", priority: "", assignee: "" })} className="px-3 py-1 flex items-center gap-2 rounded bg-gradient-to-br from-zinc-400 to-zinc-500 text-white text-xs hover:opacity-90 transition-colors" >
                        <XIcon className="size-3" /> Reset
                    </button>
                )}
            </div>

            {/* Tasks Table */}
            <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-850">
                <div className="w-full">
                    {/* Desktop/Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full text-sm text-left not-dark:bg-white text-zinc-900 dark:text-zinc-300">
                            <thead className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 text-center w-12">
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                    </th>
                                    <th className="px-4 py-3">TITLE</th>
                                    <th className="px-4 py-3">TYPE</th>
                                    <th className="px-4 py-3">PRIORITY</th>
                                    <th className="px-4 py-3">STATUS</th>
                                    <th className="px-4 py-3">ASSIGNEE</th>
                                    <th className="px-4 py-3">DUE DATE</th>
                                    <th className="px-4 py-3 text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredTasks.length > 0 ? (
                                    filteredTasks.map((task) => {
                                        const { icon: Icon, color } = typeIcons[task.type] || {};
                                        const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                        return (
                                            <tr key={task.id} onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all cursor-pointer" >
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${
                                                        task.status === "DONE" ? "bg-emerald-500" :
                                                        task.status === "IN_PROGRESS" ? "bg-amber-500" :
                                                        "bg-blue-500"
                                                    }`} />
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-150">{task.title}</td>
                                                <td className="px-4 py-3.5 text-zinc-650 dark:text-zinc-400">
                                                    <div className="flex items-center gap-2">
                                                        {Icon && <Icon className={`size-3.5 ${color}`} />}
                                                        <span className={`uppercase text-xs font-semibold ${color}`}>{task.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${background} ${prioritycolor}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-3.5">
                                                    <select name="status" onChange={(e) => handleStatusChange(task.id, e.target.value)} value={task.status} className="border border-zinc-200 dark:border-zinc-800 outline-none px-2 py-0.5 rounded text-xs text-zinc-950 dark:text-zinc-200 bg-white dark:bg-zinc-900 cursor-pointer" >
                                                        <option value="TODO">To Do</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="DONE">Done</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3.5 text-zinc-650 dark:text-zinc-400">
                                                    <div className="flex items-center gap-2">
                                                        {task.assignee?.image ? (
                                                            <img src={task.assignee.image} className="size-5 rounded-full" alt="avatar" />
                                                        ) : (
                                                            <span className="size-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px]">?</span>
                                                        )}
                                                        <span>{task.assignee?.name || "-"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-zinc-550 dark:text-zinc-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon className="size-3.5" />
                                                        <span>{task.due_date ? format(new Date(task.due_date), "dd MMM yyyy") : "-"}</span>
                                                    </div>
                                                </td>
                                                <td onClick={e => e.stopPropagation()} className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleStartEdit(task)} title="Edit Task" className="p-1.5 text-zinc-650 hover:text-blue-650 dark:text-zinc-400 dark:hover:text-blue-400 border border-zinc-250 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 transition hover:bg-blue-50 cursor-pointer" >
                                                            <Pen className="size-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTask(task.id)} title="Delete Task" className="p-1.5 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded bg-red-50 dark:bg-red-950/40 hover:bg-red-100 transition cursor-pointer" >
                                                            <Trash className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-zinc-500 dark:text-zinc-400 py-16">
                                            No tasks found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile/Card View */}
                    <div className="lg:hidden flex flex-col gap-4 p-4">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => {
                                const { icon: Icon, color } = typeIcons[task.type] || {};
                                const { background, prioritycolor } = priorityTexts[task.priority] || {};

                                return (
                                    <div key={task.id} onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)} className=" dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2 cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-zinc-900 dark:text-zinc-200 text-sm font-semibold">{task.title}</h3>
                                            <span className={`inline-block w-2 h-2 rounded-full ${
                                                task.status === "DONE" ? "bg-emerald-500" :
                                                task.status === "IN_PROGRESS" ? "bg-amber-500" :
                                                "bg-blue-500"
                                            }`} />
                                        </div>

                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                            {Icon && <Icon className={`size-4 ${color}`} />}
                                            <span className={`${color} uppercase`}>{task.type}</span>
                                        </div>

                                        <div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${background} ${prioritycolor}`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        <div onClick={e => e.stopPropagation()}>
                                            <label className="text-zinc-600 dark:text-zinc-400 text-xs">Status</label>
                                            <select name="status" onChange={(e) => handleStatusChange(task.id, e.target.value)} value={task.status} className="w-full mt-1 bg-zinc-150 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700 outline-none px-2 py-1 rounded text-sm text-zinc-900 dark:text-zinc-200" >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="DONE">Done</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                            {task.assignee?.image && <img src={task.assignee.image} className="size-5 rounded-full" alt="avatar" />}
                                            <span>{task.assignee?.name || "-"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-zinc-650 dark:text-zinc-400">
                                            <CalendarIcon className="size-4" />
                                            <span>{task.due_date ? format(new Date(task.due_date), "dd MMM yyyy") : "-"}</span>
                                        </div>

                                        <div onClick={e => e.stopPropagation()} className="flex justify-end gap-2 mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                                            <button onClick={() => handleStartEdit(task)} className="px-3 py-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 transition cursor-pointer font-medium" >
                                                <Pen className="size-3" /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteTask(task.id)} className="px-3 py-1 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition cursor-pointer font-medium" >
                                                <Trash className="size-3" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-zinc-500 dark:text-zinc-400 py-16">
                                No tasks found for the selected filters.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <EditTaskDialog
                showEditTask={showEditTask}
                setShowEditTask={setShowEditTask}
                task={taskToEdit}
                projectId={projectId}
            />
        </div>
    );
};

export default ProjectTasks;
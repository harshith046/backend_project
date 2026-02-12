import { useState, useEffect } from "react";
import axios from "axios";
import {
  Trash2,
  LogOut,
  Plus,
  CheckCircle2,
  Loader2,
  ClipboardList,
  ArrowRight,
  Mail,
  Lock,
  User,
  Edit2,
  Users as UsersIcon,
  Calendar,
  Shield,
  ShieldAlert,
  Clock,
  AlignLeft // Added icon for description
} from "lucide-react";

// API setup
const API_URL = "http://localhost:5000/api/v1";
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // State
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Add Task State
  const [newTask, setNewTask] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState(""); // New State
  const [newDueDate, setNewDueDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Edit States
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", due_date: "", completed: false }); // Added description
  const [activeTab, setActiveTab] = useState("tasks");
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ username: "", role: "" });

  // --- Axios Interceptors ---
  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem("token");
      if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
      return config;
    });

    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          setMessage({ type: "error", text: "Session expired. Please login again." });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchTasks();
      if (user.role === "ADMIN") fetchUsers();
    }
  }, [token, user]);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setTasks([]);
    setUsers([]);
    setForm({ username: "", email: "", password: "" });
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks");
      setTasks(data || []);
    } catch (err) {
      if (err.response?.status !== 401) {
        setMessage({ type: "error", text: err.response?.data?.error || "Failed to load tasks" });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setActionLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email: form.email, password: form.password } : form;

      const { data } = await api.post(endpoint, payload);

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setForm({ username: "", email: "", password: "" });
        setMessage({ type: "success", text: "Logged in successfully!" });
      } else if (!isLogin) {
        setMessage({ type: "success", text: "Account created! Please sign in." });
        setIsLogin(true);
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || "Authentication failed");
    } finally {
      setActionLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      // Send description in POST request
      await api.post("/tasks", { 
        title: newTask, 
        description: newTaskDescription, 
        due_date: newDueDate || null 
      });
      fetchTasks();
      setNewTask("");
      setNewTaskDescription(""); // Reset description
      setNewDueDate("");
      setMessage({ type: "success", text: "Task added!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to add task" });
    }
  };

  const toggleComplete = async (id, current) => {
    try {
      await api.put(`/tasks/${id}`, { completed: !current });
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !current } : t));
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update status" });
      fetchTasks();
    }
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditForm({
      title: task.title,
      description: task.description || "", // Load existing description
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
      completed: task.completed,
    });
  };

  const saveEditTask = async () => {
    if (!editingTask) return;
    try {
      await api.put(`/tasks/${editingTask}`, editForm);
      fetchTasks();
      setEditingTask(null);
      setMessage({ type: "success", text: "Task updated!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update task" });
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      setMessage({ type: "success", text: "Task deleted!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete task" });
      fetchTasks();
    }
  };

  const startEditUser = (u) => {
    setEditingUser(u);
    setEditUserForm({ username: u.username, role: u.role });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/users/${editingUser.id}`, editUserForm);
      fetchUsers();
      setEditingUser(null);
      setMessage({ type: "success", text: "User updated!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update user" });
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      setMessage({ type: "success", text: "User deleted!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete user" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserStatus = (lastLoginDate) => {
    if (!lastLoginDate) return "inactive";
    const daysSinceLogin = (new Date() - new Date(lastLoginDate)) / (1000 * 3600 * 24);
    return daysSinceLogin < 7 ? "active" : "inactive";
  };

  // --- Render: Auth Screen ---
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-indigo-100 rounded-full">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-center text-gray-500 mb-8">
            {isLogin ? "Sign in to manage your tasks" : "Get started with TaskMaster today"}
          </p>

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Sign In" : "Sign Up")}
              {!actionLoading && isLogin && <ArrowRight size={18} />}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main App ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                TaskMaster
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user?.username}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">{user?.role}</span>
              </div>
              <button 
                onClick={logout} 
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message.text && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
             {message.type === 'success' ? <CheckCircle2 size={20}/> : <ShieldAlert size={20}/>}
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'ADMIN' ? 'Dashboard' : 'My Tasks'}
          </h1>
          
          {user?.role === 'ADMIN' && (
            <div className="flex bg-gray-200 p-1 rounded-lg self-start">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'tasks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('tasks')}
              >
                All Tasks
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('users')}
              >
                Manage Users
              </button>
            </div>
          )}
        </div>

        {/* Stats Row for Admin */}
        {user?.role === 'ADMIN' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <UsersIcon size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Recently</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {users.filter(u => getUserStatus(u.last_login) === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Tasks</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{tasks.filter(t => !t.completed).length}</p>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <ClipboardList size={24} />
              </div>
            </div>
          </div>
        )}

        {/* --- TASKS TAB --- */}
        {activeTab === 'tasks' && (
          <>
            {user?.role !== 'ADMIN' && (
              <form onSubmit={addTask} className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                 <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full p-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
                      required
                    />
                    <div className="relative">
                      <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                      <textarea
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Add a description (optional)"
                        className="w-full pl-10 p-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none h-20"
                      />
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-100">
                    <input
                      type="datetime-local"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-600 text-sm"
                    />
                    <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium transition-colors">
                      <Plus size={20} />
                      <span>Add Task</span>
                    </button>
                 </div>
              </form>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
                <p className="text-gray-500 mt-1">Add a task above to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`group bg-white p-5 rounded-xl border transition-all hover:shadow-md ${task.completed ? 'bg-gray-50 border-gray-200' : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => toggleComplete(task.id, task.completed)}
                        className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-indigo-500'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>

                      <div className="flex-1">
                        {editingTask === task.id ? (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-indigo-500"
                              placeholder="Task Title"
                              autoFocus
                            />
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-2 border rounded mb-3 focus:ring-2 focus:ring-indigo-500 text-sm h-20 resize-y"
                              placeholder="Description"
                            />
                            <div className="flex gap-4 mb-4">
                              <input
                                type="datetime-local"
                                value={editForm.due_date}
                                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveEditTask} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700">
                                Save Changes
                              </button>
                              <button onClick={() => setEditingTask(null)} className="bg-white border text-gray-600 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className={`text-lg font-medium transition-all ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              
                              {/* Description Display */}
                              {task.description && (
                                <p className={`mt-1 text-sm whitespace-pre-wrap ${task.completed ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {task.description}
                                </p>
                              )}

                              {task.due_date && (
                                <p className={`text-sm mt-2 flex items-center gap-1.5 ${
                                  new Date(task.due_date) < new Date() && !task.completed ? 'text-red-500 font-medium' : 'text-gray-400'
                                }`}>
                                  <Calendar size={14} /> 
                                  {formatDate(task.due_date)} at {formatTime(task.due_date)}
                                  {new Date(task.due_date) < new Date() && !task.completed && " (Overdue)"}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditTask(task)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && user?.role === 'ADMIN' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => {
                    const status = getUserStatus(u.last_login);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold ${
                              u.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                            }`}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{u.username}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(u.created_at || u.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>{formatDate(u.last_login)}</span>
                            <span className="text-xs text-gray-400">{formatTime(u.last_login)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEditUser(u)} className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Edit User</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-700">Username</label>
                      <input
                        type="text"
                        value={editUserForm.username}
                        onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-gray-700">Role</label>
                      <select
                        value={editUserForm.role}
                        onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEditUser}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
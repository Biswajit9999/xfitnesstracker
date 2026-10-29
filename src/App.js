import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const KEY = "healthAndFitness";
const emptyForm = { date: "", intake: "", burned: "", description: "" };

const toLocalISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const loadRecords = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export default function App() {
  const [records, setRecords] = useState(loadRecords);
  const [form, setForm] = useState(emptyForm);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(records));
  }, [records]);

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (r) => {
    setMode("edit");
    setEditingId(r.id);
    setForm({
      date: r.date,
      intake: String(r.intake),
      burned: String(r.burned),
      description: r.description,
    });
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !form.date ||
      form.intake === "" ||
      form.burned === "" ||
      !form.description.trim()
    )
      return;
    const data = {
      date: form.date,
      intake: Number(form.intake),
      burned: Number(form.burned),
      description: form.description.trim(),
    };
    if (mode === "edit") {
      setRecords((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...data } : r)),
      );
    } else {
      setRecords((prev) => [...prev, { id: Date.now(), ...data }]);
    }
    closeModal();
  };

  const handleDelete = (id) =>
    setRecords((prev) => prev.filter((r) => r.id !== id));

  // Last 7 calendar days (today included), not last 7 records
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const startISO = toLocalISO(start);
  const todayISO = toLocalISO(today);

  const weeklyData = records
    .filter((r) => r.date >= startISO && r.date <= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date,
      calorieIntake: r.intake,
      calorieBurned: r.burned,
    }));

  const totalIntake = records.reduce((s, r) => s + r.intake, 0);
  const totalBurned = records.reduce((s, r) => s + r.burned, 0);
  const pieData = [
    { name: "Intake", value: totalIntake, color: "#a100ff" },
    { name: "Burned", value: totalBurned, color: "#ff9800" },
  ];
  const total = totalIntake + totalBurned;

  const recent = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="app">
      <h1 className="app-title">Health And Fitness Tracker</h1>

      <section className="top-panel">
        <div className="update-card">
          <h2>Update Today's Data</h2>
          <button className="add-btn" onClick={openAdd}>
            + Add data
          </button>
        </div>

        {weeklyData.length > 0 ? (
          <div className="weekly">
            <h2>Weekly Health Trends</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calorieIntake" fill="#8884d8" />
                  <Bar dataKey="calorieBurned" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="no-data">No data available</p>
        )}
      </section>

      <section className="bottom">
        <div className="recent">
          <h2 className="section-title">Recent Health Statistics</h2>
          {recent.length === 0 ? (
            <p className="muted">No Progress to show!</p>
          ) : (
            <ul className="record-list">
              {recent.map((r) => (
                <li key={r.id} className="record">
                  <div className="record-info">
                    <p className="record-desc">{r.description}</p>
                    <p className="record-cal">
                      Calories Intake = {r.intake} &nbsp; Calories Burned ={" "}
                      {r.burned}
                    </p>
                  </div>
                  <span className="record-date">{r.date}</span>
                  <button
                    className="icon-btn delete"
                    aria-label="Delete"
                    onClick={() => handleDelete(r.id)}
                  >
                    ✕
                  </button>
                  <button
                    className="icon-btn edit"
                    aria-label="Edit"
                    onClick={() => openEdit(r)}
                  >
                    ✎
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overall">
          <h2 className="section-title">Overall Data</h2>
          <PieChart width={260} height={260}>
            <Pie
              data={total > 0 ? pieData : []}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={60}
              label={({ percent }) => `${Math.round(percent * 100)}%`}
              labelLine={false}
            >
              {pieData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            {/* <Legend verticalAlign="bottom" /> */}
          </PieChart>
          <div className="pie-legend">
            {pieData.map((d) => (
              <span key={d.name} style={{ color: d.color }}>
                <i style={{ background: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {isOpen && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <h3>
                {mode === "edit"
                  ? "Let's see what you want to change!"
                  : "How Much Net Calories did you take Today?"}
              </h3>

              <label htmlFor="date">Date:</label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <label htmlFor="intake">Calorie Intake:</label>
              <input
                id="intake"
                name="intake"
                type="number"
                min="0"
                placeholder="Enter Today's Calorie Intake"
                value={form.intake}
                onChange={handleChange}
                required
              />

              <label htmlFor="burned">Calorie Burned:</label>
              <input
                id="burned"
                name="burned"
                type="number"
                min="0"
                placeholder="Enter Today's Calorie Burned"
                value={form.burned}
                onChange={handleChange}
                required
              />

              <label htmlFor="description">Short Description:</label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="Enter a short description"
                value={form.description}
                onChange={handleChange}
                required
              />

              <button type="submit" className="submit-btn">
                Submit
              </button>
              <button type="button" className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import AuthView from "./components/AuthView";
import { authApi, groupsApi } from "./services/api";
import { formatCOP } from "./utils/formatCurrency";

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("split_token") || "",
  );
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("split_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDetail, setGroupDetail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create group collapsible state
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");

  // Edit group name & delete group modal state
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editGroupNameValue, setEditGroupNameValue] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [savingGroupAction, setSavingGroupAction] = useState(false);

  // Manage members collapsible state (edit, add, remove)
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [draftMembers, setDraftMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [savingMembers, setSavingMembers] = useState(false);

  // Add expense form state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState([]);

  // Expense history collapsible state (collapsed by default)
  const [showHistory, setShowHistory] = useState(false);

  const saveSession = (authData) => {
    setToken(authData.token);
    setUser(authData.user);
    localStorage.setItem("split_token", authData.token);
    localStorage.setItem("split_user", JSON.stringify(authData.user));
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setGroups([]);
    setSelectedGroupId("");
    setGroupDetail(null);
    setShowCreateGroupForm(false);
    setIsEditingGroupName(false);
    setShowDeleteModal(false);
    setShowMembersPanel(false);
    setShowHistory(false);
    localStorage.removeItem("split_token");
    localStorage.removeItem("split_user");
  };

  const handleAuth = async (mode, payload) => {
    try {
      setLoading(true);
      setError("");
      const data =
        mode === "signup"
          ? await authApi.signup(payload)
          : await authApi.signin(payload);
      saveSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authApi.demoLogin();
      saveSession(data);
      setShowCreateGroupForm(false);
      setIsEditingGroupName(false);
      setShowDeleteModal(false);
      setShowMembersPanel(false);
      setShowHistory(false);
      if (data.demoGroupId) {
        setSelectedGroupId(data.demoGroupId);
      } else {
        setSelectedGroupId("");
        setGroupDetail(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    if (!token) return;
    try {
      const list = await groupsApi.getAll(token);
      setGroups(list);
      if (list.length > 0 && !selectedGroupId) {
        setSelectedGroupId(list[0]._id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const syncGroupState = (data) => {
    setGroupDetail(data);
    setEditGroupNameValue(data.group.name || "");
    const members = data.group.members || [];
    setDraftMembers(members);
    setPaidBy((prev) => (members.includes(prev) ? prev : members[0] || ""));
    setSplitBetween((prev) => {
      const filtered = prev.filter((m) => members.includes(m));
      return filtered.length > 0 ? filtered : members;
    });
  };

  const loadGroupDetail = async (id) => {
    if (!token || !id) return;
    try {
      const data = await groupsApi.getById(id, token);
      syncGroupState(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadGroups();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedGroupId) {
      loadGroupDetail(selectedGroupId);
    }
  }, [token, selectedGroupId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const membersArray = newGroupMembers
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const created = await groupsApi.create(
        { name: newGroupName, members: membersArray },
        token,
      );
      setNewGroupName("");
      setNewGroupMembers("");
      setShowCreateGroupForm(false);
      await loadGroups();
      setSelectedGroupId(created._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveGroupName = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    const trimmed = editGroupNameValue.trim();
    if (!trimmed) {
      setError("Group name cannot be empty.");
      return;
    }

    try {
      setSavingGroupAction(true);
      setError("");
      const updated = await groupsApi.update(
        selectedGroupId,
        { name: trimmed },
        token,
      );
      syncGroupState(updated);
      setIsEditingGroupName(false);
      await loadGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGroupAction(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId || !groupDetail) return;

    try {
      setSavingGroupAction(true);
      setError("");
      await groupsApi.remove(selectedGroupId, token);

      const remaining = groups.filter((g) => g._id !== selectedGroupId);
      setGroups(remaining);
      setShowDeleteModal(false);
      setIsEditingGroupName(false);
      setShowMembersPanel(false);
      setShowHistory(false);

      if (remaining.length > 0) {
        setSelectedGroupId(remaining[0]._id);
      } else {
        setSelectedGroupId("");
        setGroupDetail(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGroupAction(false);
    }
  };

  const handleDraftMemberChange = (index, value) => {
    setDraftMembers((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  };

  const handleAddDraftMember = (e) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (draftMembers.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setError("That participant is already in the group.");
      return;
    }
    setError("");
    setDraftMembers((prev) => [...prev, trimmed]);
    setNewMemberName("");
  };

  const handleRemoveDraftMember = (index) => {
    if (draftMembers.length <= 2) {
      setError("A group needs at least 2 participants.");
      return;
    }
    setError("");
    setDraftMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMembers = async () => {
    if (!selectedGroupId) return;
    const cleaned = draftMembers.map((m) => m.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      setError("Enter at least 2 valid participant names.");
      return;
    }

    try {
      setSavingMembers(true);
      setError("");
      const updated = await groupsApi.updateMembers(
        selectedGroupId,
        cleaned,
        token,
      );
      syncGroupState(updated);
      setShowMembersPanel(false);
      await loadGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMembers(false);
    }
  };

  const toggleSplitMember = (member) => {
    setSplitBetween((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member],
    );
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    if (splitBetween.length === 0) {
      setError("Select at least one member to split the expense.");
      return;
    }

    try {
      setError("");
      const updated = await groupsApi.addExpense(
        selectedGroupId,
        {
          title: expenseTitle,
          amount: Number(expenseAmount),
          paidBy,
          splitBetween,
        },
        token,
      );
      syncGroupState(updated);
      setExpenseTitle("");
      setExpenseAmount("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token) {
    return (
      <AuthView
        onAuthSuccess={handleAuth}
        onDemoLogin={handleDemoLogin}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-title">
            <h1>SplitWise Lite</h1>
            {user?.isDemo && <span className="demo-badge">Demo Mode</span>}
          </div>

          <div className="user-controls">
            <span className="user-name">
              Signed in as <strong>{user?.name}</strong>
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-grid">
          {/* Left Sidebar: Groups */}
          <aside className="card">
            <h3 className="card-title">Your Groups</h3>

            {groups.length === 0 ? (
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  marginTop: 0,
                }}
              >
                No groups yet. Click below to create your first group.
              </p>
            ) : (
              <ul className="group-list">
                {groups.map((g) => (
                  <li key={g._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(g._id);
                        setIsEditingGroupName(false);
                        setShowMembersPanel(false);
                      }}
                      className={`group-item-btn ${g._id === selectedGroupId ? "active" : ""}`}
                    >
                      <span>{g.name}</span>
                      <span className="member-count-pill">
                        {g.members.length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <hr className="divider" />

            {!showCreateGroupForm ? (
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => setShowCreateGroupForm(true)}
              >
                + Create Group
              </button>
            ) : (
              <form
                onSubmit={handleCreateGroup}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong style={{ fontSize: "0.95rem" }}>
                    Create New Group
                  </strong>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.25rem 0.55rem", fontSize: "0.8rem" }}
                    onClick={() => setShowCreateGroupForm(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="field-group">
                  <label className="field-label">Group Name</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Weekend Trip"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">
                    Members (comma-separated)
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Alex, Sam, Mia"
                    value={newGroupMembers}
                    onChange={(e) => setNewGroupMembers(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  Save Group
                </button>
              </form>
            )}
          </aside>

          {/* Main Content: Selected Group */}
          <main>
            {!groupDetail ? (
              <div className="card empty-state">
                <h3>No Group Selected</h3>
                <p>
                  Click &ldquo;+ Create Group&rdquo; on the left to start
                  splitting expenses.
                </p>
              </div>
            ) : (
              <div className="main-stack">
                {/* Summary: Net Balances & Suggested Settlements */}
                <section className="card">
                  <div className="group-header">
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      {isEditingGroupName ? (
                        <form
                          onSubmit={handleSaveGroupName}
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            className="input"
                            type="text"
                            style={{ maxWidth: "280px" }}
                            value={editGroupNameValue}
                            onChange={(e) =>
                              setEditGroupNameValue(e.target.value)
                            }
                            autoFocus
                            required
                          />
                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                              padding: "0.5rem 0.85rem",
                              fontSize: "0.85rem",
                            }}
                            disabled={savingGroupAction}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{
                              padding: "0.5rem 0.85rem",
                              fontSize: "0.85rem",
                            }}
                            onClick={() => {
                              setEditGroupNameValue(groupDetail.group.name);
                              setIsEditingGroupName(false);
                            }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <h2>{groupDetail.group.name}</h2>
                      )}
                      <p className="members-subtitle">
                        Members: {groupDetail.group.members.join(" • ")}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      {!isEditingGroupName && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{
                            padding: "0.45rem 0.8rem",
                            fontSize: "0.85rem",
                          }}
                          onClick={() => {
                            setEditGroupNameValue(groupDetail.group.name);
                            setIsEditingGroupName(true);
                          }}
                        >
                          Rename
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{
                          padding: "0.45rem 0.8rem",
                          fontSize: "0.85rem",
                        }}
                        onClick={() => {
                          setDraftMembers(groupDetail.group.members || []);
                          setShowMembersPanel((prev) => !prev);
                        }}
                      >
                        {showMembersPanel ? "Close Members" : "Manage Members"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{
                          padding: "0.45rem 0.8rem",
                          fontSize: "0.85rem",
                          color: "var(--negative)",
                        }}
                        onClick={() => setShowDeleteModal(true)}
                        disabled={savingGroupAction}
                      >
                        Delete Group
                      </button>
                    </div>
                  </div>

                  {showMembersPanel && (
                    <div
                      className="sub-panel"
                      style={{
                        marginBottom: "1.25rem",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <h4>Edit, Add or Remove Participants</h4>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.55rem",
                          marginBottom: "0.85rem",
                        }}
                      >
                        {draftMembers.map((member, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              alignItems: "center",
                            }}
                          >
                            <input
                              className="input"
                              type="text"
                              value={member}
                              onChange={(e) =>
                                handleDraftMemberChange(idx, e.target.value)
                              }
                              aria-label={`Participant ${idx + 1}`}
                            />
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{
                                color: "var(--negative)",
                                padding: "0.6rem 0.75rem",
                              }}
                              onClick={() => handleRemoveDraftMember(idx)}
                              title="Remove participant"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={handleAddDraftMember}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginBottom: "0.9rem",
                        }}
                      >
                        <input
                          className="input"
                          type="text"
                          placeholder="Add new participant name..."
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                        />
                        <button type="submit" className="btn btn-ghost">
                          + Add
                        </button>
                      </form>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setDraftMembers(groupDetail.group.members || []);
                            setShowMembersPanel(false);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSaveMembers}
                          disabled={savingMembers}
                        >
                          {savingMembers ? "Saving..." : "Save Participants"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="summary-grid">
                    <div className="sub-panel">
                      <h4>Net Balances</h4>
                      <ul className="balance-list">
                        {Object.entries(groupDetail.balances).map(
                          ([member, balance]) => (
                            <li key={member} className="balance-row">
                              <strong>{member}</strong>
                              <span
                                className={
                                  balance >= 0
                                    ? "badge-positive"
                                    : "badge-negative"
                                }
                              >
                                {balance > 0
                                  ? `+${formatCOP(balance)}`
                                  : formatCOP(balance)}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="sub-panel">
                      <h4>Suggested Settlements</h4>
                      {groupDetail.settlements.length === 0 ? (
                        <p
                          style={{
                            margin: 0,
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          All settled up! No transfers needed.
                        </p>
                      ) : (
                        <ul className="settlement-list">
                          {groupDetail.settlements.map((s, idx) => (
                            <li key={idx} className="settlement-row">
                              <strong>{s.from}</strong> pays{" "}
                              <strong style={{ color: "var(--primary-hover)" }}>
                                {formatCOP(s.amount)}
                              </strong>{" "}
                              to <strong>{s.to}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>

                {/* Add Expense Form */}
                <section className="card">
                  <h3 className="card-title">Add New Expense</h3>
                  <form
                    onSubmit={handleAddExpense}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.9rem",
                    }}
                  >
                    <div className="form-row-2">
                      <div className="field-group">
                        <label className="field-label">Description</label>
                        <input
                          className="input"
                          type="text"
                          placeholder="e.g. Airbnb, Dinner, Groceries"
                          value={expenseTitle}
                          onChange={(e) => setExpenseTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Amount (COP)</label>
                        <input
                          className="input"
                          type="number"
                          step="1"
                          min="1"
                          placeholder="200000"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label">Paid By</label>
                      <select
                        className="select"
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                      >
                        {groupDetail.group.members.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group">
                      <label className="field-label">
                        Split Equally Between
                      </label>
                      <div className="pills-container">
                        {groupDetail.group.members.map((m) => {
                          const isSelected = splitBetween.includes(m);
                          return (
                            <label
                              key={m}
                              className={`member-pill ${isSelected ? "selected" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSplitMember(m)}
                              />
                              {m}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      + Add Expense
                    </button>
                  </form>
                </section>

                {/* Collapsible Expense History */}
                <section className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: showHistory ? "1rem" : 0,
                    }}
                  >
                    <h3 className="card-title" style={{ margin: 0 }}>
                      Expense History ({groupDetail.group.expenses.length})
                    </h3>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => setShowHistory((prev) => !prev)}
                    >
                      {showHistory ? "Hide History ▲" : "Show History ▼"}
                    </button>
                  </div>

                  {showHistory &&
                    (groupDetail.group.expenses.length === 0 ? (
                      <p
                        style={{
                          margin: 0,
                          color: "var(--text-muted)",
                          fontSize: "0.92rem",
                        }}
                      >
                        No expenses recorded yet. Add your first expense above.
                      </p>
                    ) : (
                      <ul className="expense-list">
                        {groupDetail.group.expenses.map((exp) => (
                          <li key={exp._id} className="expense-item">
                            <div>
                              <div className="expense-title">{exp.title}</div>
                              <div className="expense-meta">
                                Paid by <strong>{exp.paidBy}</strong> • Split
                                among {exp.splitBetween.join(", ")}
                              </div>
                            </div>
                            <div className="expense-amount">
                              {formatCOP(exp.amount)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ))}
                </section>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Dark Backdrop Modal Popup for Delete Group */}
      {showDeleteModal && groupDetail && (
        <div
          className="modal-backdrop"
          onClick={() => !savingGroupAction && setShowDeleteModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">!</div>
            <h3>Delete &ldquo;{groupDetail.group.name}&rdquo;?</h3>
            <p>
              This will permanently remove this group and all its recorded
              expenses. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={savingGroupAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteGroup}
                disabled={savingGroupAction}
              >
                {savingGroupAction ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
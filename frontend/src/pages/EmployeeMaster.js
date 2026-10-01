import React, { useState, useEffect } from "react";
import {
  MdPeople,
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdVisibility,
  MdVisibilityOff,
  MdLockPerson,
} from "react-icons/md";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ToastContainer from "../components/Toast";
import useToast from "../hooks/useToast";
import {
  employeesApi,
  departmentsApi,
  designationsApi,
  hrApi,
} from "../utils/api";
import { V, validate as validateFields } from "../utils/validators";

const blank = {
  name: "",
  email: "",
  phone: "",
  address: "",
  gender: "",
  salary: "",
  workShift: "Day",
  cast: "",
  bod: "",
  age: "",
  joiningDate: "",
  department: "",
  designation: "",
  status: "Active",
  image: "",
  docImage: "",
  password: "",
  confirmPassword: "",
  imageFile: null,
  docImageFile: null,
};

// Designations that get a login account
const ADMIN_DESIGNATIONS = ["HR", "Admin", "Manager", "Head", "HR Manager"];

// Map designation titles to valid user role enum values
const mapDesignationToRole = (designationTitle) => {
  if (!designationTitle) return "User";
  const title = designationTitle.toLowerCase();

  if (title.includes("admin")) return "Admin";
  if (title.includes("hr manager") || title.includes("hr")) return "HR";

  return "User";
};

const statusClass = {
  Active: "d_success",
  Inactive: "d_danger",
  "On Leave": "d_warning",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const calcAge = (bod) => {
  if (!bod) return "";
  const birth = new Date(bod);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const EmployeeMaster = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  // login-account status fetched when editing
  const [userStatus, setUserStatus] = useState(null); // null | { hasUser, role, status }
  const [userStatusLoading, setUserStatusLoading] = useState(false);
  // confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { toasts, toast, removeToast } = useToast();

  const canManage = ["Admin", "HR", "Manager"].includes(currentUser?.role);

  // ── Designation / Department helpers ───────────────────────
  const isAdminDesignation = (designationId) => {
    const designation = designations.find(
      (d) => (d._id || d.id) === designationId,
    );
    return (
      designation &&
      ADMIN_DESIGNATIONS.some((admin) =>
        designation.title?.toLowerCase().includes(admin.toLowerCase()),
      )
    );
  };

  const isHRDepartment = (departmentId) => {
    const department = departments.find(
      (d) => (d._id || d.id) === departmentId,
    );
    return department && department.title?.toLowerCase().includes("hr");
  };

  const isHRManagerDesignation = (designationId) => {
    const designation = designations.find(
      (d) => (d._id || d.id) === designationId,
    );
    return (
      designation && designation.title?.toLowerCase().includes("hr manager")
    );
  };

  // FIX: was calling undefined isAdminDesig / isHRDept
  const needsLoginAccount = () =>
    isAdminDesignation(form.designation) || isHRDepartment(form.department);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [empRes, deptRes, desRes] = await Promise.all([
        employeesApi.getAll(),
        departmentsApi.getAll(),
        designationsApi.getAll(),
      ]);
      setData(empRes.data);
      setDepartments(deptRes.data);
      setDesignations(desRes.data);
    } catch (err) {
      setError(err.displayMessage || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Designations filtered by selected department
  const filteredDesigs = form.department
    ? designations.filter(
        (d) =>
          (d.department?._id || d.department?.id || d.department) ===
          form.department,
      )
    : designations;

  // Table search
  const filtered = data.filter(
    (e) =>
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.department?.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  // ── Open Add modal ──────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...blank, imageFile: null, docImageFile: null });
    setEditId(null);
    setErrors({});
    setShowPwd(false);
    setShowConfPwd(false);
    setUserStatus(null);
    setModal(true);
  };

  // ── Open Edit modal ─────────────────────────────────────────
  const openEdit = async (emp) => {
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      phone: String(emp.phoneNo || ""),
      address: emp.address || "",
      gender: emp.gender || "",
      salary: emp.salary || "",
      workShift: emp.workShift || "Day",
      cast: emp.cast || "",
      bod: emp.bod ? emp.bod.split("T")[0] : "",
      age: emp.age || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
      department:
        emp.department?._id || emp.department?.id || emp.department || "",
      designation:
        emp.designation?._id || emp.designation?.id || emp.designation || "",
      status: emp.status || "Active",
      image: emp.image || "",
      docImage: emp.docImage || "",
      password: "",
      confirmPassword: "",
      imageFile: null,
      docImageFile: null,
    });
    setEditId(emp._id || emp.id);
    setErrors({});
    setShowPwd(false);
    setShowConfPwd(false);
    setUserStatus(null);
    setModal(true);

    // Fetch login account status for this employee
    if (canManage) {
      setUserStatusLoading(true);
      try {
        const res = await hrApi.getEmployeeUserStatus(emp._id || emp.id);
        setUserStatus(res.data);
      } catch {
        setUserStatus(null);
      } finally {
        setUserStatusLoading(false);
      }
    }
  };

  // ── Validate ────────────────────────────────────────────────
  const validate = () => {
    const e = validateFields({
      name: V.name(form.name, "Employee name"),
      phone: V.phone(form.phone),
      email: V.email(form.email),
      salary: form.salary !== "" ? V.optionalAmount(form.salary, "Salary") : "",
    });
    if (!form.department) e.department = "Department is required";
    if (!form.designation) e.designation = "Designation is required";

    // Email and phone must be unique across all employees
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const others = data.filter((emp) => (emp._id || emp.id) !== editId);

    if (email) {
      const dupEmail = others.find(
        (emp) => (emp.email || "").trim().toLowerCase() === email,
      );
      if (dupEmail) e.email = `Email already used by ${dupEmail.name}`;
    }

    if (phone) {
      const dupPhone = others.find(
        (emp) => String(emp.phoneNo || "").trim() === phone,
      );
      if (dupPhone) e.phone = `Phone number already used by ${dupPhone.name}`;
    }

    // Password rules for login-account designations
    if (needsLoginAccount()) {
      const pwd = form.password.trim();
      if (!editId) {
        // Add mode: password required
        if (!pwd) e.password = "Password is required for this role";
        else if (pwd.length < 6)
          e.password = "Password must be at least 6 characters";
        else if (pwd !== form.confirmPassword.trim())
          e.confirmPassword = "Passwords do not match";
      } else if (pwd) {
        // Edit mode: password optional but if given must be valid
        if (pwd.length < 6)
          e.password = "Password must be at least 6 characters";
        else if (pwd !== form.confirmPassword.trim())
          e.confirmPassword = "Passwords do not match";
      }
    }
    return e;
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        phoneNo: form.phone,
        address: form.address,
        gender: form.gender,
        salary: form.salary ? Number(form.salary) : undefined,
        workShift: form.workShift,
        cast: form.cast,
        bod: form.bod || undefined,
        age: form.age ? Number(form.age) : undefined,
        joiningDate: form.joiningDate || undefined,
        department: form.department,
        designation: form.designation,
        status: form.status,
        image: form.image || undefined,
        docImage: form.docImage || undefined,
      };

      if (editId) {
        await employeesApi.update(
          editId,
          payload,
          form.imageFile,
          form.docImageFile,
        );

        // Update login account password if provided
        if (
          (isAdminDesignation(form.designation) ||
            isHRDepartment(form.department) ||
            isHRManagerDesignation(form.designation)) &&
          form.password.trim()
        ) {
          const designation = designations.find(
            (d) => (d._id || d.id) === form.designation,
          );
          const role = mapDesignationToRole(designation?.title);
          await hrApi.createUserWithRole(editId, role, form.password.trim());
        }
      } else {
        const employee = await employeesApi.create(
          payload,
          form.imageFile,
          form.docImageFile,
        );
        const newId = employee.data._id || employee.data.id;

        // Create login account for qualifying designations/departments
        if (
          (isAdminDesignation(form.designation) ||
            isHRDepartment(form.department) ||
            isHRManagerDesignation(form.designation)) &&
          form.password.trim()
        ) {
          const designation = designations.find(
            (d) => (d._id || d.id) === form.designation,
          );
          const role = mapDesignationToRole(designation?.title);
          await hrApi.createUserWithRole(newId, role, form.password.trim());
        }
      }

      setModal(false);
      fetchAll();
      toast.success(
        editId
          ? "Employee updated successfully"
          : "Employee added successfully",
      );
    } catch (err) {
      setError(
        err.displayMessage ||
          err.response?.data?.error ||
          "Failed to save employee",
      );
      toast.error(
        err.displayMessage ||
          err.response?.data?.error ||
          "Failed to save employee",
      );
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!deleteId) return;

    try {
      setConfirmOpen(false);

      await employeesApi.remove(deleteId);

      setDeleteId(null);
      await fetchAll();

      toast.success("Employee deleted successfully");
    } catch (err) {
      setDeleteId(null);
      setError(err.displayMessage || "Failed to delete employee");
      toast.error(err.displayMessage || "Failed to delete employee");
    }
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  // ── Field helper ────────────────────────────────────────────
  const f = (field) => ({
    value: form[field],
    onChange: (ev) => {
      const val = ev.target.value;
      setForm((p) => {
        const next = { ...p, [field]: val };
        if (field === "department") next.designation = "";
        if (field === "bod") next.age = calcAge(val);
        return next;
      });
      setErrors((p) => ({ ...p, [field]: "" }));
    },
  });

  // ── Render ──────────────────────────────────────────────────
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Employee Master</h1>
          <p className="d_page_subtitle">
            Manage all employee records and worker logins
          </p>
        </div>
        {canManage && (
          <button className="d_btn d_btn_primary" onClick={openAdd}>
            <MdAdd /> Add Employee
          </button>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="d_card">
        <div className="d_card_header flex-wrap gap-2">
          <h2 className="d_card_title">
            <MdPeople className="d_card_icon" /> All Employees (
            {filtered.length})
          </h2>
          <div className="d_search_box">
            <MdSearch className="d_search_icon" />
            <input
              className="d_search_input"
              placeholder="Search name, ID, dept…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="d_card_body p-0">
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {loading ? (
            <div className="text-center py-4">Loading employees…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Salary</th>
                    <th>Shift</th>
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Doc Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={12}>No employees found.</td>
                    </tr>
                  )}
                  {filtered.map((e) => (
                    <tr key={e._id || e.id}>
                      <td>
                        <code>{e.id || e._id}</code>
                      </td>
                      <td>
                        <strong>{e.name}</strong>
                      </td>
                      <td>{e.department?.title || "-"}</td>
                      <td>{e.designation?.title || "-"}</td>
                      <td>{e.phoneNo || "-"}</td>
                      <td>{e.email}</td>
                      <td>
                        {e.salary
                          ? `₹${Number(e.salary).toLocaleString("en-IN")}`
                          : "-"}
                      </td>
                      <td>{e.workShift || "-"}</td>
                      <td>
                        <span
                          className={`d_badge ${statusClass[e.status] || "d_info"}`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td>
                        {e.image ? (
                          <img
                            src={`http://localhost:5000${e.image}`}
                            alt={e.name}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              window.open(
                                `http://localhost:5000${e.image}`,
                                "_blank",
                              )
                            }
                          />
                        ) : (
                          <span style={{ color: "#999", fontSize: 12 }}>
                            No image
                          </span>
                        )}
                      </td>
                      <td>
                        {e.docImage ? (
                          <img
                            src={`http://localhost:5000${e.docImage}`}
                            alt="Document"
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              window.open(
                                `http://localhost:5000${e.docImage}`,
                                "_blank",
                              )
                            }
                          />
                        ) : (
                          <span style={{ color: "#999", fontSize: 12 }}>
                            No doc
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d_action_btns">
                          {canManage && (
                            <>
                              <button
                                className="d_icon_btn d_edit"
                                title="Edit"
                                onClick={() => openEdit(e)}
                              >
                                <MdEdit />
                              </button>
                              <button
                                className="d_icon_btn d_del"
                                title="Delete"
                                onClick={() => handleDelete(e._id || e.id)}
                              >
                                <MdDelete />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? "Edit Employee" : "Add New Employee"}
        size="lg"
      >
        {/* Login account banner (edit mode only) */}
        {editId && needsLoginAccount() && (
          <div
            className={`d_alert ${userStatusLoading ? "d_info" : userStatus?.hasUser ? "d_success" : "d_warning"} mb-3`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
            }}
          >
            <MdLockPerson style={{ fontSize: 18, flexShrink: 0 }} />
            <span style={{ fontSize: 13 }}>
              {userStatusLoading
                ? "Checking login account…"
                : userStatus?.hasUser
                  ? `Login account exists · Role: ${userStatus.role} · ${userStatus.status} — leave password blank to keep unchanged`
                  : "No login account yet — enter a password below to create one"}
            </span>
          </div>
        )}

        {/* Row 1 — Name & Email */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">
              Full Name <span className="d_req">*</span>
            </label>
            <input
              className="d_form_control"
              placeholder="e.g. Rajesh Kumar"
              {...f("name")}
            />
            {errors.name && (
              <span className="d_field_error">{errors.name}</span>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">
              Email <span className="d_req">*</span>
            </label>
            <input
              type="email"
              className="d_form_control"
              placeholder="email@airjet.in"
              {...f("email")}
            />
            {errors.email && (
              <span className="d_field_error">{errors.email}</span>
            )}
          </div>
        </div>

        {/* Row 2 — Department & Designation */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">
              Department <span className="d_req">*</span>
            </label>
            <select className="d_form_control" {...f("department")}>
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {String(d.title)}
                </option>
              ))}
            </select>
            {errors.department && (
              <span className="d_field_error">{errors.department}</span>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">
              Designation <span className="d_req">*</span>
            </label>
            <select className="d_form_control" {...f("designation")}>
              <option value="">Select Designation</option>
              {filteredDesigs.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {String(d.title)}
                </option>
              ))}
            </select>
            {errors.designation && (
              <span className="d_field_error">{errors.designation}</span>
            )}
          </div>
        </div>

        {/* Row 3 — Phone & Gender */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">
              Phone <span className="d_req">*</span>
            </label>
            <input
              className="d_form_control"
              placeholder="10-digit mobile"
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]{10}"
              {...f("phone")}
            />
            {errors.phone && (
              <span className="d_field_error">{errors.phone}</span>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Gender</label>
            <select className="d_form_control" {...f("gender")}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Row 4 — Salary & Shift */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Salary (₹)</label>
            <input
              type="number"
              className="d_form_control"
              placeholder="e.g. 25000"
              min={0}
              {...f("salary")}
            />
            {errors.salary && (
              <span className="d_field_error">{errors.salary}</span>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Work Shift</label>
            <select className="d_form_control" {...f("workShift")}>
              <option>Day</option>
              <option>Night</option>
              <option>Rotational</option>
            </select>
          </div>
        </div>

        {/* Row 5 — DOB & Age */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Date of Birth</label>
            <input type="date" className="d_form_control" {...f("bod")} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Age (auto-calculated)</label>
            <input
              type="number"
              className="d_form_control"
              placeholder="Auto-filled from DOB"
              readOnly={!!form.bod}
              {...f("age")}
            />
          </div>
        </div>

        {/* Row 6 — Joining Date & Status */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Joining Date</label>
            <input
              type="date"
              className="d_form_control"
              {...f("joiningDate")}
            />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f("status")}>
              <option>Active</option>
              <option>Inactive</option>
              <option>On Leave</option>
            </select>
          </div>
        </div>

        {/* Row 7 — Address & Category */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Address</label>
            <input
              className="d_form_control"
              placeholder="Full address"
              {...f("address")}
            />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Category</label>
            <input
              className="d_form_control"
              placeholder="e.g. General"
              {...f("cast")}
            />
          </div>
        </div>

        {/* Row 8 — Profile Image & Document Image */}
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Profile Image</label>
            <input
              type="file"
              className="d_form_control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setForm((p) => ({
                    ...p,
                    imageFile: file,
                    image: URL.createObjectURL(file),
                  }));
                }
              }}
            />
            {form.image && !form.imageFile && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={form.image.startsWith('http') ? form.image : `http://localhost:5000${form.image}`}
                  alt="Profile"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
            {form.imageFile && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={form.image}
                  alt="Preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #ddd",
                  }}
                />
                <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
                  {form.imageFile.name}
                </span>
              </div>
            )}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Document Image</label>
            <input
              type="file"
              className="d_form_control"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setForm((p) => ({
                    ...p,
                    docImageFile: file,
                    docImage: URL.createObjectURL(file),
                  }));
                }
              }}
            />
            {form.docImage && !form.docImageFile && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={form.docImage.startsWith('http') ? form.docImage : `http://localhost:5000${form.docImage}`}
                  alt="Document"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
            {form.docImageFile && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={form.docImage}
                  alt="Preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 4,
                    border: "1px solid #ddd",
                  }}
                />
                <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>
                  {form.docImageFile.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Row 9 — Password (only for admin/HR designations) */}
        {needsLoginAccount() && (
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">
                Password {!editId && <span className="d_req">*</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  className="d_form_control"
                  placeholder={
                    editId ? "Leave blank to keep existing" : "Min 6 characters"
                  }
                  value={form.password}
                  onChange={(ev) => {
                    setForm((p) => ({ ...p, password: ev.target.value }));
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={pwdToggleStyle}
                  tabIndex={-1}
                >
                  {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.password && (
                <span className="d_field_error">{errors.password}</span>
              )}
            </div>

            <div className="d_form_group">
              <label className="d_form_label">
                Confirm Password {!editId && <span className="d_req">*</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfPwd ? "text" : "password"}
                  className="d_form_control"
                  placeholder={
                    editId ? "Leave blank to keep existing" : "Repeat password"
                  }
                  value={form.confirmPassword}
                  onChange={(ev) => {
                    setForm((p) => ({
                      ...p,
                      confirmPassword: ev.target.value,
                    }));
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfPwd((v) => !v)}
                  style={pwdToggleStyle}
                  tabIndex={-1}
                >
                  {showConfPwd ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="d_field_error">{errors.confirmPassword}</span>
              )}
            </div>
          </div>
        )}

        <div className="d_form_actions">
          <button
            className="d_btn d_btn_outline"
            onClick={() => setModal(false)}
          >
            Cancel
          </button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>
            {editId ? "Update Employee" : "Save Employee"}
          </button>
        </div>
      </Modal>

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Employee"
        message="Are you sure you want to delete this employee and their login account? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};

const pwdToggleStyle = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--d-text-muted)",
  display: "flex",
  alignItems: "center",
  padding: 0,
};

export default EmployeeMaster;

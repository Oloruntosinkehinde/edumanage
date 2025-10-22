(function () {
    class BulkEntryPage {
        constructor() {
            this.elements = this.mapDomElements();
            this.validateDependencies();
            this.state = this.initializeStateFromQuery();
            this.bindEvents();
            this.bootstrap();
        }

        mapDomElements() {
            return {
                form: document.getElementById("bulkEntryForm"),
                classSelect: document.getElementById("bulkClassSelect"),
                subjectSelect: document.getElementById("bulkSubjectSelect"),
                sessionSelect: document.getElementById("bulkSessionSelect"),
                termSelect: document.getElementById("bulkTermSelect"),
                resetDraftBtn: document.getElementById("resetDraftBtn"),
                headerRow: document.getElementById("bulkEntryHeaderRow"),
                tableBody: document.getElementById("bulkEntryBody"),
                emptyState: document.getElementById("bulkEmptyState"),
                tableWrapper: document.getElementById("bulkEntryTableWrapper"),
            };
        }

        validateDependencies() {
            const missing = ["app", "resultManager", "notificationManager", "dropdownManager"].filter((key) => !window[key]);
            if (missing.length) {
                throw new Error(`BulkEntryPage initialization failed. Missing globals: ${missing.join(", ")}`);
            }

            this.app = window.app;
            this.resultManager = window.resultManager;
            this.notifications = window.notificationManager;
            this.dropdownManager = window.dropdownManager;
        }

        initializeStateFromQuery() {
            const search = new URLSearchParams(window.location.search);
            return {
                session: search.get("session") || this.resultManager?.currentSession || this.app?.data?.settings?.currentSession || "",
                term: search.get("term") || this.resultManager?.currentTerm || this.app?.data?.settings?.currentTerm || "",
                className: search.get("class") || "",
                subjectCode: search.get("subject") || "",
            };
        }

        bindEvents() {
            this.elements.form?.addEventListener("submit", (event) => {
                event.preventDefault();
                this.saveChanges();
            });

            this.elements.resetDraftBtn?.addEventListener("click", () => this.renderTable());

            this.elements.classSelect?.addEventListener("change", (event) => {
                this.state.className = event.target.value;
                this.state.subjectCode = "";
                this.populateSubjectOptions();
                this.renderTable();
            });

            this.elements.subjectSelect?.addEventListener("change", (event) => {
                this.state.subjectCode = event.target.value;
                this.renderTable();
            });

            this.elements.sessionSelect?.addEventListener("change", (event) => {
                this.state.session = event.target.value;
                this.renderTable();
            });

            this.elements.termSelect?.addEventListener("change", (event) => {
                this.state.term = event.target.value;
                this.renderTable();
            });

            this.elements.tableBody?.addEventListener("input", (event) => this.handleRowInput(event));
            this.elements.tableBody?.addEventListener("click", (event) => this.handleRowAction(event));
        }

        bootstrap() {
            // Use dropdown manager for automatic population
            this.dropdownManager.populateSessionDropdown(this.elements.sessionSelect, this.state.session);
            this.dropdownManager.populateTermDropdown(this.elements.termSelect, this.state.term);
            this.dropdownManager.populateClassDropdown(this.elements.classSelect, this.state.className);
            this.populateSubjectOptions(); // Keep custom logic for subject dependencies
            this.renderTable();
        }

        populateSessionOptions() {
            // Deprecated - using dropdown manager instead
            this.dropdownManager.populateSessionDropdown(this.elements.sessionSelect, this.state.session);
            
            if (!this.state.session) {
                this.state.session = this.dropdownManager.getCurrentSession();
            }
        }

        populateTermOptions() {
            // Deprecated - using dropdown manager instead
            this.dropdownManager.populateTermDropdown(this.elements.termSelect, this.state.term);
            
            if (!this.state.term) {
                this.state.term = this.dropdownManager.getCurrentTerm();
            }
        }

        populateClassOptions() {
            // Deprecated - using dropdown manager instead
            this.dropdownManager.populateClassDropdown(this.elements.classSelect, this.state.className);
            
            if (!this.state.className) {
                const classes = this.dropdownManager.getClasses();
                if (classes.length) {
                    this.state.className = classes[0];
                }
            }
        }

        populateSubjectOptions() {
            const subjects = this.getSubjectsForClass(this.state.className);
            if (!subjects.length) {
                this.dropdownManager.populateSelect(this.elements.subjectSelect, ["No subjects configured"], "", { 
                    emptyLabel: "No subjects configured", 
                    disabled: true 
                });
                this.state.subjectCode = "";
                return;
            }

            const defaultCode = subjects.some((subject) => subject.code === this.state.subjectCode)
                ? this.state.subjectCode
                : subjects[0].code;

            this.dropdownManager.populateSelect(
                this.elements.subjectSelect,
                subjects.map((subject) => ({ value: subject.code, label: `${subject.code} — ${subject.name}` })),
                defaultCode,
                { emptyLabel: "-- Select Subject --" }
            );

            this.state.subjectCode = defaultCode;
        }

        populateSelect(select, options, selectedValue = "", disabled = false) {
            if (!select) return;
            select.disabled = disabled;

            const normalizedOptions = options.map((option) =>
                typeof option === "object"
                    ? option
                    : { value: option, label: option }
            );

            select.innerHTML = normalizedOptions
                .map(({ value, label }) => `<option value="${value}">${label}</option>`)
                .join("");

            if (selectedValue) {
                select.value = selectedValue;
            }
        }

        getSubjectsForClass(className) {
            if (!className) return [];

            const subjectsFromApp = this.app.getSubjectsByClass?.(className) || [];
            if (Array.isArray(subjectsFromApp) && subjectsFromApp.length) {
                return subjectsFromApp.map((subject) => ({
                    code: subject.code,
                    name: subject.name || subject.code,
                }));
            }

            const subjectCodes = this.resultManager.getClassSubjects?.(className) || [];
            return subjectCodes.map((code) => {
                const subject = this.app.getSubjectByCode?.(code);
                return {
                    code,
                    name: subject?.name || code,
                };
            });
        }

        buildColumns() {
            const config = this.resultManager.getScoringConfig?.(this.state.session, this.state.term) || this.resultManager.scoringConfig || {};
            const columns = [
                { key: "ca", label: `CA (${config.ca ?? config.caWeight ?? 0})`, max: Number(config.ca ?? config.caWeight ?? 0) },
                { key: "test", label: `Test (${config.test ?? config.testWeight ?? 0})`, max: Number(config.test ?? config.testWeight ?? 0) },
                { key: "exam", label: `Exam (${config.exam ?? config.examWeight ?? 0})`, max: Number(config.exam ?? config.examWeight ?? 0) },
            ];

            return columns.filter((column) => Number.isFinite(column.max) && column.max > 0);
        }

        renderTable() {
            const { className, subjectCode, session, term } = this.state;
            const body = this.elements.tableBody;
            if (!body) return;

            const columns = (this.columns = this.buildColumns());
            this.renderHeader(columns);

            if (!className) {
                this.showEmptyState("Select a class", "Choose a class to view student records.");
                return;
            }

            if (!subjectCode) {
                this.showEmptyState("Select a subject", "Choose a subject to record scores.");
                return;
            }

            const students = this.app.getStudentsByClass?.(className, session) || [];
            if (!students.length) {
                this.showEmptyState("No students found", "Add students to this class before entering scores.");
                return;
            }

            this.hideEmptyState();

            const rows = students
                .map((student, index) => {
                    const studentResults = this.resultManager.getStudentResults?.(student.studentId, className, term, session) || {};
                    const subjectResult = studentResults?.[subjectCode] || null;

                    const inputs = columns
                        .map((column) => {
                            const value = subjectResult?.[column.key];
                            const safeValue = value === undefined || value === null ? "" : value;
                            return `
                                <td>
                                    <input
                                        type="number"
                                        class="form-control score-input"
                                        data-field="${column.key}"
                                        min="0"
                                        max="${column.max}"
                                        value="${safeValue}"
                                    />
                                </td>
                            `;
                        })
                        .join("");

                    const total = columns.reduce((sum, column) => {
                        const value = subjectResult?.[column.key];
                        return sum + (Number.isFinite(Number(value)) ? Number(value) : 0);
                    }, 0);

                    const hasScores = columns.some((column) => subjectResult?.[column.key] !== undefined && subjectResult?.[column.key] !== null && subjectResult?.[column.key] !== "");
                    const totalDisplay = hasScores ? this.formatScore(total) : "--";
                    const gradeDisplay = hasScores
                        ? this.renderGrade(this.resultManager.calculateGrade?.(total, session, term))
                        : "--";

                    return `
                        <tr data-student="${student.studentId}" data-name="${student.name || "Student"}">
                            <td>${index + 1}</td>
                            <td>
                                <strong>${student.name}</strong>
                                <div class="table-subtitle">${student.studentId}</div>
                            </td>
                            ${inputs}
                            <td data-cell="total" class="total-cell">${totalDisplay}</td>
                            <td data-cell="grade" class="grade-cell">${gradeDisplay}</td>
                            <td class="text-center">
                                <button type="button" class="btn btn-link text-danger" data-row-action="delete" title="Delete result">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                })
                .join("");

            body.innerHTML = rows;
        }

        renderHeader(columns) {
            const header = this.elements.headerRow;
            if (!header) return;

            const columnMarkup = columns.map((column) => `<th>${column.label}</th>`).join("");
            header.innerHTML = `
                <th>#</th>
                <th>Student</th>
                ${columnMarkup}
                <th>Total</th>
                <th>Grade</th>
                <th></th>
            `;
        }

        handleRowInput(event) {
            const input = event.target;
            if (!input.classList?.contains("score-input")) {
                return;
            }

            const row = input.closest("tr[data-student]");
            if (!row) return;

            delete row.dataset.delete;
            row.classList.remove("pending-delete");
            this.refreshRowTotals(row);
        }

        handleRowAction(event) {
            const trigger = event.target.closest("[data-row-action]");
            if (!trigger) return;

            const action = trigger.dataset.rowAction;
            const row = trigger.closest("tr[data-student]");
            if (!row) return;

            if (action === "delete") {
                const hasExistingScores = Array.from(row.querySelectorAll("input.score-input")).some((input) => input.value !== "");
                if (hasExistingScores) {
                    row.dataset.delete = "true";
                    row.classList.add("pending-delete");
                    row.querySelectorAll("input.score-input").forEach((input) => (input.value = ""));
                    this.refreshRowTotals(row);
                } else {
                    row.dataset.delete = "true";
                    row.classList.add("pending-delete");
                    this.refreshRowTotals(row);
                }
            }
        }

        refreshRowTotals(row) {
            if (!row) return;

            const columns = this.columns || [];
            let total = 0;
            let hasValues = false;

            columns.forEach((column) => {
                const input = row.querySelector(`input[data-field="${column.key}"]`);
                const rawValue = input?.value ?? "";
                const numeric = Number(rawValue || 0);
                if (rawValue !== "") {
                    hasValues = true;
                }
                if (Number.isFinite(numeric)) {
                    total += numeric;
                }
            });

            const session = this.state.session;
            const term = this.state.term;

            const totalCell = row.querySelector('[data-cell="total"]');
            if (totalCell) {
                totalCell.textContent = hasValues ? this.formatScore(total) : "--";
            }

            const gradeCell = row.querySelector('[data-cell="grade"]');
            if (gradeCell) {
                const grade = hasValues ? this.resultManager.calculateGrade?.(total, session, term) : null;
                gradeCell.innerHTML = grade ? this.renderGrade(grade) : "--";
            }
        }

        saveChanges() {
            const { className, subjectCode, session, term } = this.state;

            if (!className) {
                this.notifications?.showWarning?.("Select a class", "Please choose a class to continue.");
                return;
            }

            if (!subjectCode) {
                this.notifications?.showWarning?.("Select a subject", "Please choose a subject to save scores.");
                return;
            }

            const rows = Array.from(this.elements.tableBody?.querySelectorAll("tr[data-student]") || []);
            if (!rows.length) {
                this.notifications?.showInfo?.("Nothing to save", "No rows available for bulk entry.");
                return;
            }

            const updates = [];
            const deletions = [];

            rows.forEach((row) => {
                const studentId = row.dataset.student;
                if (!studentId) return;

                if (row.dataset.delete === "true") {
                    deletions.push(studentId);
                    return;
                }

                const scores = {};
                let hasValue = false;

                (this.columns || []).forEach((column) => {
                    const input = row.querySelector(`input[data-field="${column.key}"]`);
                    const raw = input?.value ?? "";
                    const numeric = Number(raw || 0);
                    scores[column.key] = Number.isFinite(numeric) ? numeric : 0;
                    if (raw !== "") {
                        hasValue = true;
                    }
                });

                if (hasValue) {
                    updates.push({ studentId, scores });
                }
            });

            if (!updates.length && !deletions.length) {
                this.notifications?.showWarning?.("No changes detected", "Enter scores or mark records for deletion first.");
                return;
            }

            let saved = 0;
            updates.forEach(({ studentId, scores }) => {
                const result = this.resultManager.updateStudentResult?.(studentId, className, subjectCode, scores, term, session);
                if (result?.success) {
                    saved += 1;
                }
            });

            let removed = 0;
            deletions.forEach((studentId) => {
                const result = this.resultManager.deleteStudentResult?.(studentId, className, subjectCode, term, session);
                if (result?.success) {
                    removed += 1;
                }
            });

            if (saved || removed) {
                const parts = [];
                if (saved) parts.push(`${saved} ${saved === 1 ? "record" : "records"} saved`);
                if (removed) parts.push(`${removed} ${removed === 1 ? "record" : "records"} removed`);
                this.notifications?.showSuccess?.("Bulk update successful", parts.join(", "));
            } else {
                this.notifications?.showInfo?.("No changes applied", "Scores remain unchanged.");
            }

            this.renderTable();
        }

        showEmptyState(title, message) {
            if (this.elements.emptyState) {
                this.elements.emptyState.classList.remove("d-none");
                this.elements.emptyState.innerHTML = `<strong>${title}</strong><br>${message}`;
            }
            if (this.elements.tableBody) {
                this.elements.tableBody.innerHTML = "";
            }
        }

        hideEmptyState() {
            this.elements.emptyState?.classList.add("d-none");
        }

        formatScore(value) {
            if (value === null || value === undefined || Number.isNaN(Number(value))) {
                return "--";
            }
            return Number(value).toFixed(1).replace(/\.0$/, "");
        }

        renderGrade(grade) {
            if (!grade) return "--";
            const normalized = String(grade).trim().toLowerCase();
            return `<span class="badge grade-badge grade-${normalized}">${grade}</span>`;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        try {
            window.bulkEntryPage = new BulkEntryPage();
        } catch (error) {
            console.error("Failed to initialize bulk entry page", error);
        }
    });
})();

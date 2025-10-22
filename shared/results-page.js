/**
 * Admin Results Page Controller
 * Handles results dashboard interactions, rendering, and integrations.
 */
(function () {
    const REQUIRED_MANAGERS = ["app", "resultManager", "csvManager", "notificationManager"];

    class AdminResultsPage {
        constructor() {
            this.elements = this.mapDomElements();
            this.validateDependencies();
            this.bindEvents();
            this.initState();
            this.renderInitialState();
        }

        mapDomElements() {
            return {
                heroSession: document.getElementById("heroSession"),
                heroTerm: document.getElementById("heroTerm"),
                heroLastUpdated: document.getElementById("heroLastUpdated"),
                actionButtons: document.querySelectorAll("[data-action]"),
                summaryCards: {
                    totalStudents: document.getElementById("summaryTotalStudents"),
                    resultsSubmitted: document.getElementById("summaryResultsSubmitted"),
                    outstanding: document.getElementById("summaryOutstanding"),
                    averageScore: document.getElementById("summaryAverageScore"),
                },
                sessionSelect: document.getElementById("sessionSelect"),
                termSelect: document.getElementById("termSelect"),
                classTabsContainer: document.getElementById("classTabsContainer"),
                resultsTableContainer: document.getElementById("resultsTableContainer"),
                searchInput: document.getElementById("studentSearch"),
                refreshButton: document.getElementById("refreshResultsBtn"),
                reportCardsButton: document.getElementById("reportCardsBtn"),
                bulkEntryButton: document.getElementById("bulkEntryBtn"),
                scoringConfigButton: document.getElementById("scoringConfigBtn"),
                subjectConfigButton: document.getElementById("subjectConfigBtn"),
                scoringConfigButtonSecondary: document.getElementById("scoringConfigBtnSecondary"),
                subjectConfigButtonSecondary: document.getElementById("subjectConfigBtnSecondary"),
                downloadPdfButton: document.getElementById("downloadPDFBtn"),
                uploadCsvButton: document.getElementById("uploadCSVBtn"),
                csvInput: document.getElementById("csvUploadInput"),

                // Modals & modal controls
                modals: {
                    scoringConfig: document.getElementById("scoringConfigModal"),
                    subjectConfig: document.getElementById("subjectConfigModal"),
                    bulkEntry: document.getElementById("bulkResultModal"),
                    studentResult: document.getElementById("studentResultModal"),
                },
                closeableModals: document.querySelectorAll("[data-close-modal]"),
                modalOverlays: document.querySelectorAll(".modal"),

                // Scoring config
                scoringTabs: document.querySelectorAll("[data-config-tab]"),
                scoringContents: document.querySelectorAll("[data-tab-content]"),
                scoringForm: document.getElementById("scoringConfigForm"),
                gradingBody: document.getElementById("gradingScaleBody"),
                addGradeRowButton: document.getElementById("addGradingRowBtn"),

                // Subject config
                subjectConfigClassSelect: document.getElementById("subjectConfigClassSelect"),
                assignedSubjectsContainer: document.getElementById("assignedSubjectsContainer"),
                availableSubjectsContainer: document.getElementById("availableSubjectsContainer"),
                newSubjectForm: document.getElementById("newSubjectForm"),
                newSubjectCode: document.getElementById("newSubjectCode"),
                newSubjectName: document.getElementById("newSubjectName"),

                // Bulk entry
                bulkClassSelect: document.getElementById("bulkEntryClassSelect"),
                bulkSubjectSelect: document.getElementById("bulkEntrySubjectSelect"),
                bulkResultsHeaderRow: document.getElementById("bulkResultsHeaderRow"),
                bulkResultsTableBody: document.getElementById("bulkResultsTableBody"),
                bulkResultForm: document.getElementById("bulkResultForm"),

                // Student result
                studentResultContent: document.getElementById("studentResultContent"),
                studentModalPrintBtn: document.getElementById("studentModalPrintBtn"),
            };
        }

        validateDependencies() {
            const missing = REQUIRED_MANAGERS.filter((key) => !window[key]);
            if (missing.length) {
                console.error("Missing dependencies:", missing.join(", "));
                throw new Error(`AdminResultsPage initialization failed. Missing: ${missing.join(", ")}`);
            }

            this.app = window.app;
            this.resultManager = window.resultManager;
            this.csvManager = window.csvManager;
            this.notificationManager = window.notificationManager;
        }

        bindEvents() {
            this.bindActionButtons();
            this.elements.sessionSelect?.addEventListener("change", () => this.handleSessionChange());
            this.elements.termSelect?.addEventListener("change", () => this.handleTermChange());
            this.elements.searchInput?.addEventListener("input", (event) => this.handleSearch(event));

            this.elements.csvInput?.addEventListener("change", (event) => this.handleCsvUpload(event));

            this.elements.closeableModals.forEach((button) =>
                button.addEventListener("click", (event) => {
                    const modalId = event.currentTarget.dataset.closeModal;
                    this.closeModal(modalId);
                })
            );

            this.elements.modalOverlays.forEach((modal) =>
                modal.addEventListener("click", (event) => {
                    if (event.target === modal) {
                        this.closeModal(modal.id);
                    }
                })
            );

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    Object.values(this.elements.modals).forEach((modal) => modal?.classList.remove("open"));
                }
            });

            this.elements.scoringTabs.forEach((tab) =>
                tab.addEventListener("click", (event) => {
                    const target = event.currentTarget.dataset.configTab;
                    this.switchConfigTab(target);
                })
            );

            this.elements.scoringForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                this.saveScoringConfig();
            });

            this.elements.addGradeRowButton?.addEventListener("click", () => this.addGradingRow());

            this.elements.newSubjectForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                this.addNewSubject();
            });

            this.elements.subjectConfigClassSelect?.addEventListener("change", (event) => {
                this.renderSubjectAssignments(event.target.value);
            });

            this.elements.bulkResultForm?.addEventListener("submit", (event) => {
                event.preventDefault();
                this.saveBulkResults();
            });

            this.elements.bulkClassSelect?.addEventListener("change", (event) => {
                this.handleBulkClassChange(event.target.value);
            });

            this.elements.bulkSubjectSelect?.addEventListener("change", (event) => {
                this.handleBulkSubjectChange(event.target.value);
            });

            this.elements.bulkResultsTableBody?.addEventListener("click", (event) => {
                this.handleBulkRowAction(event);
            });

            this.elements.bulkResultsTableBody?.addEventListener("input", (event) => {
                this.handleBulkRowInput(event);
            });

            this.elements.studentModalPrintBtn?.addEventListener("click", () => this.printStudentResult());
        }

        bindActionButtons() {
            const buttons = this.elements.actionButtons;
            if (!buttons || !buttons.length) return;

            const handlers = {
                "open-scoring-config": () => this.openScoringConfigModal(),
                "open-subject-config": ({ className } = {}) => this.openSubjectConfigModal(className || this.currentClass),
                "open-bulk-entry": ({ className } = {}) => this.navigateToBulkEntryPage(className || this.currentClass),
                "trigger-csv-upload": () => this.triggerCsvUpload(),
                "download-class-report": () => this.downloadClassReport(),
                "refresh-results": () => this.refreshResults(),
                "generate-report-cards": ({ className } = {}) => this.generateReportCards(className || this.currentClass),
            };

            buttons.forEach((button) => {
                const action = button.dataset.action;
                const handler = handlers[action];
                if (!handler) return;

                button.addEventListener("click", (event) => {
                    event.preventDefault();
                    if (button.hasAttribute("disabled") || button.dataset.disabled === "true") {
                        return;
                    }

                    handler.call(this, button.dataset);

                    if (typeof button.blur === "function") {
                        button.blur();
                    }
                });
            });
        }

        initState() {
            const sessions = this.resultManager?.getAvailableSessions?.() || this.resultManager?.getSessions?.() || [];
            this.availableSessions = sessions.length ? sessions : this.app.getAcademicSessions?.() || [];

            const terms = this.resultManager?.getAvailableTerms?.() || [
                "1st Term",
                "2nd Term",
                "3rd Term",
            ];

            this.currentSession = this.availableSessions[0] || this.resultManager.currentSession || this.app.currentSession;
            this.currentTerm = terms.includes(this.resultManager.currentTerm)
                ? this.resultManager.currentTerm
                : terms[0];
            this.availableTerms = terms;
            this.currentClass = null;
            this.searchQuery = "";

            this.cachedClassResults = new Map();
            this.bulkEntryState = {
                className: null,
                subjectCode: null,
            };
        }

        renderInitialState() {
            this.populateSessionOptions();
            this.populateTermOptions();
            this.updateHero();
            this.renderSummaryMetrics();
            this.renderClassTabs();
        }

        populateSessionOptions() {
            if (!this.elements.sessionSelect) return;
            this.elements.sessionSelect.innerHTML = this.availableSessions
                .map((session) => `<option value="${session}">${session}</option>`)
                .join("");

            if (this.currentSession) {
                this.elements.sessionSelect.value = this.currentSession;
            }
        }

        populateTermOptions() {
            if (!this.elements.termSelect) return;
            this.elements.termSelect.innerHTML = this.availableTerms
                .map((term) => `<option value="${term}">${term}</option>`)
                .join("");

            if (this.currentTerm) {
                this.elements.termSelect.value = this.currentTerm;
            }
        }

        populateClassTabs(selectClass = true) {
            const classes = this.app.getClassList?.() || [];
            if (!classes.length) {
                this.elements.classTabsContainer.innerHTML = this.renderEmptyState("No classes available", "Configure classes to manage results");
                return;
            }

            const markup = classes
                .map((className) =>
                    `<button class="class-tab${this.currentClass === className ? " active" : ""}" data-class="${className}">
                        ${className}
                    </button>`
                )
                .join("");

            this.elements.classTabsContainer.innerHTML = markup;

            this.elements.classTabsContainer.querySelectorAll(".class-tab").forEach((tab) =>
                tab.addEventListener("click", (event) => this.handleClassSelection(event))
            );

            if (selectClass) {
                this.currentClass = this.currentClass || classes[0];
                const activeTab = this.elements.classTabsContainer.querySelector(`.class-tab[data-class="${this.currentClass}"]`);
                activeTab?.classList.add("active");
                this.renderClassResults(this.currentClass);
            }
        }

        renderSummaryMetrics() {
            const summary = this.resultManager.getSummaryStatistics?.(this.currentSession, this.currentTerm) || {
                totalStudents: 0,
                resultsSubmitted: 0,
                averageScore: 0,
            };

            const totalStudents = summary.totalStudents || this.app.getStudentCount?.(this.currentSession) || 0;
            const submitted = summary.resultsSubmitted || 0;
            const outstanding = Math.max(totalStudents - submitted, 0);
            const average = summary.averageScore || 0;

            this.elements.summaryCards.totalStudents.textContent = this.formatNumber(totalStudents);
            this.elements.summaryCards.resultsSubmitted.textContent = this.formatNumber(submitted);
            this.elements.summaryCards.outstanding.textContent = this.formatNumber(outstanding);
            this.elements.summaryCards.averageScore.textContent = `${average.toFixed?.(1) ?? average}%`;
        }

        updateHero() {
            if (this.elements.heroSession) this.elements.heroSession.textContent = this.currentSession || "--";
            if (this.elements.heroTerm) this.elements.heroTerm.textContent = this.currentTerm || "--";
            if (this.elements.heroLastUpdated) this.elements.heroLastUpdated.textContent = this.formatLastUpdated();
        }

        handleSessionChange() {
            this.currentSession = this.elements.sessionSelect.value;
            this.cachedClassResults.clear();
            this.refreshResults();
        }

        handleTermChange() {
            this.currentTerm = this.elements.termSelect.value;
            this.cachedClassResults.clear();
            this.refreshResults();
        }

        handleClassSelection(event) {
            const className = event.currentTarget.dataset.class;
            if (className === this.currentClass) return;

            this.elements.classTabsContainer.querySelectorAll(".class-tab").forEach((tab) => tab.classList.remove("active"));
            event.currentTarget.classList.add("active");

            this.currentClass = className;
            this.renderClassResults(className);
        }

        handleSearch(event) {
            this.searchQuery = event.target.value.trim().toLowerCase();
            this.renderClassResults(this.currentClass, { useCache: true });
        }

        refreshResults() {
            this.updateHero();
            this.renderSummaryMetrics();
            this.renderClassTabs(false);
            if (this.currentClass) {
                this.renderClassResults(this.currentClass, { forceRefresh: true });
            }
            this.notificationManager?.showSuccess?.("Results refreshed", "Latest data loaded successfully");
        }

        renderClassTabs(refreshActive = true) {
            this.populateClassTabs(refreshActive);
        }

        renderClassResults(className, options = {}) {
            if (!className) {
                this.elements.resultsTableContainer.innerHTML = this.renderEmptyState(
                    "Choose a class",
                    "Pick a class to view student results"
                );
                return;
            }

            const { useCache = false, forceRefresh = false } = options;
            let classResults = null;

            if (useCache && this.cachedClassResults.has(className)) {
                classResults = this.cachedClassResults.get(className);
            }

            if (!classResults || forceRefresh) {
                classResults = this.resultManager.getClassResults?.(className, this.currentSession, this.currentTerm) || [];
                this.cachedClassResults.set(className, classResults);
            }

            const filtered = this.searchQuery
                ? classResults.filter((entry) =>
                      [entry.studentName, entry.studentId, entry.className]
                          .filter(Boolean)
                          .some((token) => token.toLowerCase().includes(this.searchQuery))
                  )
                : classResults;

            if (!filtered.length) {
                this.elements.resultsTableContainer.innerHTML = this.renderEmptyState(
                    this.searchQuery ? "No matching records" : "No results yet",
                    this.searchQuery
                        ? "Try a different name, ID, or clear the search"
                        : "Enter scores or upload CSV to begin tracking results"
                );
                return;
            }

            const tableMarkup = `
                <div class="table-header">
                    <div>
                        <h3>${className} • Result Overview</h3>
                        <p class="table-subtitle">${filtered.length} student${filtered.length === 1 ? "" : "s"} captured</p>
                    </div>
                    <div class="table-actions">
                        <button class="table-action" data-table-action="export" data-class="${className}">
                            <i class="fas fa-file-export"></i>
                            Export CSV
                        </button>
                        <button class="table-action" data-table-action="report" data-class="${className}">
                            <i class="fas fa-file-invoice"></i>
                            Report Cards
                        </button>
                        <button class="table-action" data-table-action="bulk" data-class="${className}">
                            <i class="fas fa-layer-group"></i>
                            Bulk Update
                        </button>
                    </div>
                </div>
                <div class="table-scroll">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student</th>
                                <th>Subjects</th>
                                <th>Average</th>
                                <th>Total</th>
                                <th>Grade</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered
                                .map((entry, index) =>
                                    `<tr>
                                        <td>${index + 1}</td>
                                        <td>
                                            <strong>${entry.studentName || "--"}</strong>
                                            <div class="table-subtitle">${entry.studentId || "NA"}</div>
                                        </td>
                                        <td>${entry.subjectCount || 0}</td>
                                        <td>${this.formatScore(entry.averageScore)}</td>
                                        <td>${this.formatScore(entry.totalScore)}</td>
                                        <td>${this.renderGrade(entry.grade)}</td>
                                        <td>${entry.position || "-"}</td>
                                        <td>${this.renderStatus(entry.status)}</td>
                                        <td>
                                            <button class="table-action" data-view-student="${entry.studentId}">
                                                <i class="fas fa-eye"></i>
                                                View
                                            </button>
                                        </td>
                                    </tr>`
                                )
                                .join("")}
                        </tbody>
                    </table>
                </div>
            `;

            this.elements.resultsTableContainer.innerHTML = tableMarkup;

            this.elements.resultsTableContainer
                .querySelectorAll("[data-table-action]")
                .forEach((button) => button.addEventListener("click", (event) => this.handleTableAction(event)));

            this.elements.resultsTableContainer
                .querySelectorAll("[data-view-student]")
                .forEach((button) => button.addEventListener("click", (event) => this.viewStudentResult(event)));
        }

        handleTableAction(event) {
            const action = event.currentTarget.dataset.tableAction;
            const className = event.currentTarget.dataset.class || this.currentClass;

            switch (action) {
                case "export":
                    this.exportClassResults(className);
                    break;
                case "report":
                    this.generateReportCards(className);
                    break;
                case "bulk":
                    this.navigateToBulkEntryPage(className);
                    break;
                default:
                    break;
            }
        }

        navigateToBulkEntryPage(className = "") {
            const params = new URLSearchParams();
            if (className) params.set("class", className);
            if (this.currentSession) params.set("session", this.currentSession);
            if (this.currentTerm) params.set("term", this.currentTerm);
            const url = `bulk-entry.html${params.toString() ? `?${params.toString()}` : ""}`;
            window.location.href = url;
        }

        viewStudentResult(event) {
            const studentId = event.currentTarget.dataset.viewStudent;
            if (!studentId) return;

            const student = this.app.getStudentById?.(studentId) || this.app.getStudentProfile?.(studentId);
            const sheet = this.resultManager.getStudentResultSheet?.(studentId, this.currentClass, this.currentSession, this.currentTerm);

            if (!student || !sheet) {
                this.notificationManager?.showWarning?.(
                    "Result not found",
                    "We couldn't locate a result sheet for this student"
                );
                return;
            }

            const subjectsMarkup = sheet.subjects
                .map(
                    (subject) => `
                        <tr>
                            <td>${subject.name}</td>
                            <td>${this.formatScore(subject.ca)}</td>
                            <td>${this.formatScore(subject.exam)}</td>
                            <td>${this.formatScore(subject.total)}</td>
                            <td>${this.renderGrade(subject.grade)}</td>
                            <td>${subject.remark || ""}</td>
                        </tr>
                    `
                )
                .join("");

            const summary = sheet.summary || {};

            this.elements.studentResultContent.innerHTML = `
                <section class="student-info">
                    <div>
                        <h4>${student.name}</h4>
                        <p>${student.studentId} • ${this.currentClass}</p>
                    </div>
                    <div class="meta">
                        <span>Session: ${this.currentSession}</span>
                        <span>Term: ${this.currentTerm}</span>
                    </div>
                </section>
                <section class="result-summary">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <label>Total Score</label>
                            <strong>${this.formatScore(summary.totalScore)}</strong>
                        </div>
                        <div class="stat-item">
                            <label>Average</label>
                            <strong>${this.formatScore(summary.averageScore)}</strong>
                        </div>
                        <div class="stat-item">
                            <label>Grade</label>
                            <strong>${this.renderGrade(summary.grade)}</strong>
                        </div>
                        <div class="stat-item">
                            <label>Position</label>
                            <strong>${summary.position || "--"}</strong>
                        </div>
                    </div>
                    <div class="performance-remark">
                        ${summary.remark || "No remark available."}
                    </div>
                </section>
                <section class="table-scroll">
                    <table class="student-result-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>CA</th>
                                <th>Exam</th>
                                <th>Total</th>
                                <th>Grade</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectsMarkup}
                        </tbody>
                    </table>
                </section>
            `;

            this.openModal("studentResultModal");
        }

        openScoringConfigModal() {
            const config = this.resultManager.getScoringConfig?.(this.currentSession, this.currentTerm) || {};
            const defaultConfig = {
                caWeight: config.caWeight ?? 40,
                examWeight: config.examWeight ?? 60,
                passMark: config.passMark ?? 40,
                gradingScale: config.gradingScale || this.resultManager.getDefaultGradingScale?.() || [],
            };

            this.elements.scoringForm.elements["caWeight"].value = defaultConfig.caWeight;
            this.elements.scoringForm.elements["examWeight"].value = defaultConfig.examWeight;
            this.elements.scoringForm.elements["passMark"].value = defaultConfig.passMark;

            this.renderGradingScale(defaultConfig.gradingScale);
            this.switchConfigTab("scoring");
            this.openModal("scoringConfigModal");
        }

        renderGradingScale(scale = []) {
            if (!Array.isArray(scale) || !scale.length) {
                scale = this.resultManager.getDefaultGradingScale?.() || [];
            }

            this.elements.gradingBody.innerHTML = scale
                .map(
                    (item, index) => `
                        <tr data-grade-index="${index}">
                            <td>
                                <input type="text" name="grade" value="${item.grade || ""}" maxlength="2" required />
                            </td>
                            <td>
                                <input type="number" name="min" value="${item.min || 0}" min="0" max="100" required />
                            </td>
                            <td>
                                <input type="number" name="max" value="${item.max || 0}" min="0" max="100" required />
                            </td>
                            <td>
                                <input type="text" name="remark" value="${item.remark || ""}" />
                            </td>
                        </tr>
                    `
                )
                .join("");
        }

        addGradingRow() {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <input type="text" name="grade" maxlength="2" required />
                </td>
                <td>
                    <input type="number" name="min" min="0" max="100" required />
                </td>
                <td>
                    <input type="number" name="max" min="0" max="100" required />
                </td>
                <td>
                    <input type="text" name="remark" />
                </td>
            `;
            this.elements.gradingBody.appendChild(row);
        }

        saveScoringConfig() {
            const formData = new FormData(this.elements.scoringForm);
            const payload = {
                caWeight: Number(formData.get("caWeight")) || 40,
                examWeight: Number(formData.get("examWeight")) || 60,
                passMark: Number(formData.get("passMark")) || 40,
                gradingScale: [],
            };

            this.elements.gradingBody.querySelectorAll("tr").forEach((row) => {
                const grade = row.querySelector('[name="grade"]').value.trim();
                const min = Number(row.querySelector('[name="min"]').value) || 0;
                const max = Number(row.querySelector('[name="max"]').value) || 0;
                const remark = row.querySelector('[name="remark"]').value.trim();

                if (grade) {
                    payload.gradingScale.push({ grade, min, max, remark });
                }
            });

            const totalWeight = payload.caWeight + payload.examWeight;
            if (totalWeight !== 100) {
                this.notificationManager?.showWarning?.(
                    "Invalid weight distribution",
                    "CA and Exam weights must add up to 100%"
                );
                return;
            }

            this.resultManager.updateScoringConfig?.(payload, this.currentSession, this.currentTerm);
            this.notificationManager?.showSuccess?.("Scoring updated", "Weighting applied successfully");
            this.closeModal("scoringConfigModal");
            this.refreshResults();
        }

        openSubjectConfigModal(preferredClass = this.currentClass) {
            const classes = this.app.getClassList?.() || [];
            const defaultClass = classes.includes(preferredClass) ? preferredClass : this.currentClass || classes[0];

            this.populateClassSelect(this.elements.subjectConfigClassSelect, classes, defaultClass);
            this.renderSubjectAssignments(defaultClass);
            this.openModal("subjectConfigModal");
        }

        renderSubjectAssignments(className) {
            if (!className) return;

            const assignedSubjects = this.app.getSubjectsByClass?.(className) || [];
            const availableSubjects = this.app.getAllSubjects?.() || [];

            this.elements.assignedSubjectsContainer.innerHTML = assignedSubjects.length
                ? assignedSubjects
                      .map(
                          (subject) => `
                              <span class="subject-chip" data-subject="${subject.code}">
                                  ${subject.name}
                                  <button data-remove-subject="${subject.code}" title="Remove subject">
                                      <i class="fas fa-times"></i>
                                  </button>
                              </span>
                          `
                      )
                      .join("")
                : '<p class="table-subtitle">No subjects assigned yet.</p>';

            this.elements.availableSubjectsContainer.innerHTML = availableSubjects
                .map(
                    (subject) => `
                        <article class="subject-card" data-add-subject="${subject.code}">
                            <div class="subject-code">${subject.code}</div>
                            <div class="subject-name">${subject.name}</div>
                        </article>
                    `
                )
                .join("");

            this.elements.assignedSubjectsContainer
                .querySelectorAll("[data-remove-subject]")
                .forEach((button) =>
                    button.addEventListener("click", (event) => this.handleSubjectRemoval(event, className))
                );

            this.elements.availableSubjectsContainer
                .querySelectorAll("[data-add-subject]")
                .forEach((card) => card.addEventListener("click", (event) => this.handleSubjectAddition(event, className)));
        }

        handleSubjectRemoval(event, className) {
            const subjectCode = event.currentTarget.dataset.removeSubject;
            if (!subjectCode) return;

            this.app.removeSubjectFromClass?.(className, subjectCode);
            this.notificationManager?.showInfo?.("Subject removed", `${subjectCode} detached from ${className}`);
            this.renderSubjectAssignments(className);
        }

        handleSubjectAddition(event, className) {
            const subjectCode = event.currentTarget.dataset.addSubject;
            if (!subjectCode) return;

            this.app.assignSubjectToClass?.(className, subjectCode);
            this.notificationManager?.showSuccess?.("Subject assigned", `${subjectCode} added to ${className}`);
            this.renderSubjectAssignments(className);
        }

        addNewSubject() {
            const code = this.elements.newSubjectCode.value.trim().toUpperCase();
            const name = this.elements.newSubjectName.value.trim();

            if (!code || !name) {
                this.notificationManager?.showWarning?.("Incomplete fields", "Provide both subject code and name");
                return;
            }

            this.app.addSubject?.({ code, name });
            this.notificationManager?.showSuccess?.("Subject added", `${name} (${code}) is now available`);
            this.elements.newSubjectForm.reset();
            const selectedClass = this.elements.subjectConfigClassSelect.value;
            this.renderSubjectAssignments(selectedClass);
        }

        openBulkResultModal(className = this.currentClass) {
            const classes = this.app.getClassList?.() || [];
            const targetClass = classes.includes(className)
                ? className
                : (this.currentClass && classes.includes(this.currentClass) ? this.currentClass : classes[0]);

            this.populateClassSelect(this.elements.bulkClassSelect, classes, targetClass);
            this.refreshBulkEntryContext(targetClass);
            this.openModal("bulkResultModal");
        }

        handleBulkClassChange(className) {
            this.bulkEntryState.className = className || null;
            this.bulkEntryState.subjectCode = null;
            this.refreshBulkEntryContext(className);
        }

        handleBulkSubjectChange(subjectCode) {
            if (!this.bulkEntryState) {
                this.bulkEntryState = {};
            }

            this.bulkEntryState.subjectCode = subjectCode || null;
            this.bulkEntryColumns = this.buildBulkEntryColumns();
            this.populateBulkResultHeader(this.bulkEntryColumns);
            this.populateBulkResultTable(this.bulkEntryState.className, this.bulkEntryState.subjectCode);
        }

        handleBulkRowAction(event) {
            const trigger = event.target.closest("[data-row-action]");
            if (!trigger) return;

            const action = trigger.dataset.rowAction;
            const row = trigger.closest("tr[data-student]");
            if (!row) return;

            if (action === "delete") {
                row.dataset.delete = "true";
                row.classList.add("pending-delete");
                row.querySelectorAll("input.score-input").forEach((input) => {
                    input.value = "";
                });
                this.updateBulkRowTotals(row);
            }
        }

        handleBulkRowInput(event) {
            const input = event.target;
            if (!input.classList?.contains("score-input")) {
                return;
            }

            const row = input.closest("tr[data-student]");
            if (!row) return;

            if (row.dataset.delete === "true") {
                delete row.dataset.delete;
            }
            row.classList.remove("pending-delete");
            this.updateBulkRowTotals(row);
        }

        refreshBulkEntryContext(className) {
            const subjects = this.getClassSubjectsForBulk(className);
            const selectedSubject = subjects.find((subject) => subject.code === this.bulkEntryState.subjectCode)?.code
                || subjects[0]?.code
                || "";

            this.bulkEntryState.className = className || null;
            this.bulkEntryState.subjectCode = selectedSubject || null;

            this.populateSubjectSelect(this.elements.bulkSubjectSelect, subjects, selectedSubject);

            this.bulkEntryColumns = this.buildBulkEntryColumns();
            this.populateBulkResultHeader(this.bulkEntryColumns);
            this.populateBulkResultTable(className, selectedSubject);
        }

        getClassSubjectsForBulk(className) {
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

        populateSubjectSelect(selectElement, subjects = [], selectedValue = "") {
            if (!selectElement) return;

            if (!subjects.length) {
                selectElement.innerHTML = '<option value="">No subjects configured</option>';
                selectElement.disabled = true;
                return;
            }

            selectElement.disabled = false;
            const options = subjects
                .map((subject) => `
                    <option value="${subject.code}" ${subject.code === selectedValue ? "selected" : ""}>
                        ${subject.name}
                    </option>
                `)
                .join("");
            selectElement.innerHTML = options;

            if (selectedValue) {
                selectElement.value = selectedValue;
            }
        }

        buildBulkEntryColumns() {
            const config = this.resultManager.getScoringConfig?.(this.currentSession, this.currentTerm) || this.resultManager.scoringConfig || {};
            const columnDefs = [
                { key: "ca", label: `CA (${config.ca ?? config.caWeight ?? 0})`, max: Number(config.ca ?? config.caWeight ?? 0) },
                { key: "test", label: `Test (${config.test ?? config.testWeight ?? 0})`, max: Number(config.test ?? config.testWeight ?? 0) },
                { key: "exam", label: `Exam (${config.exam ?? config.examWeight ?? 0})`, max: Number(config.exam ?? config.examWeight ?? 0) },
            ];

            return columnDefs.filter((column) => column.max > 0);
        }

        populateBulkResultHeader(columns = []) {
            const header = this.elements.bulkResultsHeaderRow;
            if (!header) return;

            const columnMarkup = columns
                .map((column) => `<th>${column.label}</th>`)
                .join("");

            header.innerHTML = `
                <th>#</th>
                <th>Student</th>
                ${columnMarkup}
                <th>Total</th>
                <th>Grade</th>
                <th></th>
            `;
        }

        populateBulkResultTable(className, subjectCode) {
            const body = this.elements.bulkResultsTableBody;
            if (!body) return;

            if (!className) {
                body.innerHTML = this.renderEmptyBulkMessage(
                    "Choose a class",
                    "Select a class to view and manage student results."
                );
                return;
            }

            if (!subjectCode) {
                body.innerHTML = this.renderEmptyBulkMessage(
                    "Choose a subject",
                    "Select a subject to capture CA, Test, and Exam scores."
                );
                return;
            }

            const students = this.app.getStudentsByClass?.(className, this.currentSession) || [];
            if (!students.length) {
                body.innerHTML = this.renderEmptyBulkMessage(
                    "No students found",
                    "Add students to this class before entering scores."
                );
                return;
            }

            const columns = this.bulkEntryColumns || this.buildBulkEntryColumns();
            const rows = students
                .map((student, index) => {
                    const studentResults = this.resultManager.getStudentResults?.(student.studentId, className, this.currentTerm, this.currentSession) || {};
                    const subjectResult = studentResults?.[subjectCode] || null;

                    const total = columns.reduce((sum, column) => {
                        const value = subjectResult?.[column.key];
                        return sum + (Number.isFinite(Number(value)) ? Number(value) : 0);
                    }, 0);

                    const grade = subjectResult?.grade || (total > 0
                        ? this.resultManager.calculateGrade?.(total, this.currentSession, this.currentTerm)
                        : null);

                    const hasExistingScores = columns.some((column) =>
                        subjectResult && subjectResult[column.key] !== undefined && subjectResult[column.key] !== null
                    );

                    const totalDisplay = hasExistingScores ? this.formatScore(total) : "--";
                    const gradeDisplay = grade ? this.renderGrade(grade) : "--";

                    const inputsMarkup = columns
                        .map((column) => {
                            const value = subjectResult?.[column.key] ?? "";
                            return `
                                <td>
                                    <input
                                        class="score-input"
                                        type="number"
                                        min="0"
                                        max="${column.max}"
                                        data-field="${column.key}"
                                        value="${value}"
                                    />
                                </td>
                            `;
                        })
                        .join("");

                    return `
                        <tr data-student="${student.studentId}" data-persisted="${subjectResult ? "true" : "false"}">
                            <td>${index + 1}</td>
                            <td>
                                <strong>${student.name}</strong>
                                <div class="table-subtitle">${student.studentId}</div>
                            </td>
                            ${inputsMarkup}
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

            body.innerHTML = rows || this.renderEmptyBulkMessage(
                "No records",
                "Scores will appear here once entered."
            );
        }

        renderEmptyBulkMessage(title, description) {
            return `
                <tr>
                    <td colspan="${(this.bulkEntryColumns?.length || 0) + 5}" class="empty-state">
                        <div class="icon"><i class="fas fa-clipboard-list"></i></div>
                        <h3>${title}</h3>
                        <p>${description}</p>
                    </td>
                </tr>
            `;
        }

        updateBulkRowTotals(row) {
            if (!row) return;

            const columns = this.bulkEntryColumns || this.buildBulkEntryColumns();
            let total = 0;
            let hasValues = false;
            columns.forEach((column) => {
                const input = row.querySelector(`input[data-field="${column.key}"]`);
                const rawValue = input?.value ?? "";
                const value = Number(rawValue || 0);
                if (Number.isFinite(value)) {
                    total += value;
                }
                if (rawValue !== "") {
                    hasValues = true;
                }
            });

            const totalCell = row.querySelector('[data-cell="total"]');
            if (totalCell) {
                totalCell.textContent = hasValues ? this.formatScore(total) : "--";
            }

            const gradeCell = row.querySelector('[data-cell="grade"]');
            if (gradeCell) {
                const grade = hasValues ? this.resultManager.calculateGrade?.(total, this.currentSession, this.currentTerm) : null;
                gradeCell.innerHTML = grade ? this.renderGrade(grade) : "--";
            }
        }

        saveBulkResults() {
            const className = this.elements.bulkClassSelect?.value;
            const subjectCode = this.elements.bulkSubjectSelect?.value;

            if (!className) {
                this.notificationManager?.showWarning?.("Select a class", "Choose a class before saving scores.");
                return;
            }

            if (!subjectCode) {
                this.notificationManager?.showWarning?.("Select a subject", "Choose a subject to apply these scores.");
                return;
            }

            const rows = Array.from(this.elements.bulkResultsTableBody?.querySelectorAll("tr[data-student]") || []);
            if (!rows.length) {
                this.notificationManager?.showInfo?.("Nothing to save", "There are no students listed for this class.");
                return;
            }

            const columns = this.bulkEntryColumns || this.buildBulkEntryColumns();

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

                columns.forEach((column) => {
                    const input = row.querySelector(`input[data-field="${column.key}"]`);
                    const rawValue = input?.value ?? "";
                    const numeric = Number(rawValue || 0);
                    scores[column.key] = Number.isFinite(numeric) ? numeric : 0;
                    if (rawValue !== "") {
                        hasValue = true;
                    }
                });

                if (hasValue) {
                    updates.push({ studentId, scores });
                }
            });

            if (!updates.length && !deletions.length) {
                this.notificationManager?.showWarning?.(
                    "No changes detected",
                    "Enter scores or mark rows for deletion before saving."
                );
                return;
            }

            let saved = 0;
            updates.forEach(({ studentId, scores }) => {
                const result = this.resultManager.updateStudentResult?.(
                    studentId,
                    className,
                    subjectCode,
                    scores,
                    this.currentTerm,
                    this.currentSession
                );
                if (result?.success) {
                    saved += 1;
                }
            });

            let removed = 0;
            deletions.forEach((studentId) => {
                const result = this.resultManager.deleteStudentResult?.(
                    studentId,
                    className,
                    subjectCode,
                    this.currentTerm,
                    this.currentSession
                );
                if (result?.success) {
                    removed += 1;
                }
            });

            if (saved || removed) {
                const summaryParts = [];
                if (saved) summaryParts.push(`${saved} ${saved === 1 ? "record saved" : "records saved"}`);
                if (removed) summaryParts.push(`${removed} ${removed === 1 ? "record removed" : "records removed"}`);
                this.notificationManager?.showSuccess?.(
                    "Bulk update successful",
                    summaryParts.join(", ")
                );
            } else {
                this.notificationManager?.showInfo?.("No changes applied", "Existing scores were unchanged.");
            }

            this.refreshResults();
            this.refreshBulkEntryContext(className);
        }

        triggerCsvUpload() {
            this.elements.csvInput?.click();
        }

        handleCsvUpload(event) {
            const file = event.target.files?.[0];
            if (!file) return;

            this.csvManager.importResultsFromFile?.(file, {
                session: this.currentSession,
                term: this.currentTerm,
                onSuccess: (summary) => {
                    this.notificationManager?.showSuccess?.(
                        "CSV processed",
                        `${summary.processed ?? 0} entries imported successfully`
                    );
                    this.refreshResults();
                },
                onError: (error) => {
                    console.error(error);
                    this.notificationManager?.showError?.("Upload failed", error?.message || "Unable to process CSV");
                },
            });

            event.target.value = "";
        }

        generateReportCards(className = this.currentClass) {
            if (!className) {
                this.notificationManager?.showInfo?.("Select a class", "Choose a class to generate report cards");
                return;
            }

            this.resultManager.generateReportCards?.(className, this.currentSession, this.currentTerm);
            this.notificationManager?.showSuccess?.(
                "Report cards ready",
                `${className} report cards generated for ${this.currentTerm}`
            );
        }

        exportClassResults(className = this.currentClass) {
            if (!className) {
                this.notificationManager?.showInfo?.("Select a class", "Choose a class to export results");
                return;
            }

            this.resultManager.exportClassResults?.(className, this.currentSession, this.currentTerm);
        }

        downloadClassReport() {
            if (!this.currentClass) {
                this.notificationManager?.showInfo?.("Select a class", "Choose a class first to download report");
                return;
            }

            if (typeof window.downloadPDF === "function") {
                window.downloadPDF(this.currentClass, this.currentSession, this.currentTerm);
            } else {
                this.notificationManager?.showWarning?.(
                    "PDF not available",
                    "PDF generator is not ready on this page"
                );
            }
        }

        openModal(modalId) {
            const modal = this.elements.modals[modalId] || document.getElementById(modalId);
            modal?.classList.add("open");
            document.body.classList.add("modal-open");
        }

        closeModal(modalId) {
            const modal = this.elements.modals[modalId] || document.getElementById(modalId);
            modal?.classList.remove("open");
            if (!document.querySelector(".modal.open")) {
                document.body.classList.remove("modal-open");
            }
        }

        switchConfigTab(tab) {
            this.elements.scoringTabs.forEach((button) =>
                button.classList.toggle("active", button.dataset.configTab === tab)
            );
            this.elements.scoringContents.forEach((content) =>
                content.classList.toggle("active", content.dataset.tabContent === tab)
            );
        }

        populateClassSelect(selectElement, classList = [], defaultValue = null) {
            if (!selectElement) return;
            selectElement.innerHTML = classList
                .map((item) => `<option value="${item}">${item}</option>`)
                .join("");
            if (defaultValue && classList.includes(defaultValue)) {
                selectElement.value = defaultValue;
            }
        }

        renderEmptyState(title, description) {
            return `
                <div class="empty-state">
                    <div class="icon">
                        <i class="fas fa-file-circle-question"></i>
                    </div>
                    <h3>${title}</h3>
                    <p>${description}</p>
                </div>
            `;
        }

        renderGrade(grade) {
            if (!grade) return "--";
            const normalized = String(grade).trim().toLowerCase();
            return `<span class="badge grade-badge grade-${normalized}">${grade}</span>`;
        }

        renderStatus(status) {
            if (!status) return "--";
            const normalized = String(status).trim().toLowerCase();
            return `<span class="badge badge-${normalized}">${status}</span>`;
        }

        formatScore(value) {
            if (value === null || value === undefined || Number.isNaN(value)) return "--";
            return Number(value).toFixed?.(1) || value;
        }

        formatNumber(value) {
            if (value === null || value === undefined) return "0";
            return Number(value).toLocaleString();
        }

        formatLastUpdated() {
            const now = new Date();
            return now.toLocaleString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        }

        printStudentResult() {
            const modal = this.elements.modals.studentResult;
            if (!modal) return;
            const content = modal.querySelector(".modal-content");
            const printWindow = window.open("", "PRINT", "height=800,width=600");
            if (!printWindow) return;

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Student Result</title>
                        <link rel="stylesheet" href="../shared/styles.css" />
                        <link rel="stylesheet" href="../shared/results.css" />
                    </head>
                    <body class="printable-results">
                        ${content.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        try {
            window.resultsPage = new AdminResultsPage();
        } catch (error) {
            console.error("Failed to initialize results page", error);
        }
    });
})();

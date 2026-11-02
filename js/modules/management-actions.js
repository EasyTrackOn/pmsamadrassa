(() => {
    'use strict';

    let editingRecord = null;

    const forms = {
        students: document.getElementById('addStudentForm'),
        classes: document.getElementById('classroomForm'),
        subjects: document.getElementById('subjectForm'),
        exams: document.getElementById('newExamForm')
    };

    const formModals = {};
    const formDefinitions = [
        { key: 'academicYear', title: 'Add Academic Year', form: '#academicYearForm' },
        { key: 'students', title: 'Add Student', form: '#addStudentForm' },
        { key: 'bulkUpload', title: 'Bulk Upload Students', form: '#rosterCsvFileInput' },
        { key: 'classes', title: 'Add Classroom', form: '#classroomForm' },
        { key: 'subjects', title: 'Add Subject', form: '#subjectForm' }
    ];

    function mountFormModals() {
        const sourceColumns = new Set();

        formDefinitions.forEach(({ key, title, form: selector }) => {
            const form = document.querySelector(selector);
            const card = form?.closest('.card');
            const body = card?.querySelector('.card-body');
            if (!form || !card || !body) {
                throw new Error(`Could not mount ${key} form in a popup.`);
            }

            const sourceColumn = card.closest('.col-12.col-lg-4');
            if (sourceColumn) sourceColumns.add(sourceColumn);

            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = `managementFormModal-${key}`;
            modal.tabIndex = -1;
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow">
                        <div class="modal-header">
                            <h2 class="modal-title fs-5 fw-bold"></h2>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body"></div>
                    </div>
                </div>
            `;
            modal.querySelector('.modal-title').textContent = title;
            body.classList.remove('border-top');
            modal.querySelector('.modal-body').appendChild(body);
            document.body.appendChild(modal);
            formModals[key] = modal;
            card.remove();
        });

        sourceColumns.forEach(column => column.remove());

        ['panelAcademicYears', 'panelStudents', 'panelClasses', 'panelSubjects'].forEach(panelId => {
            document.querySelectorAll(`#${panelId} .row > .col-lg-8`).forEach(column => {
                column.classList.remove('col-lg-8');
            });
        });
    }

    function showFormModal(key) {
        const modal = formModals[key];
        if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
    }

    function hideFormModal(key) {
        const modal = formModals[key];
        if (modal) bootstrap.Modal.getOrCreateInstance(modal).hide();
    }

    function setButton(buttonId, text, icon) {
        const button = document.getElementById(buttonId);
        if (button) button.innerHTML = `<i class="fa-solid ${icon} me-1"></i> ${text}`;
    }

    function resetExamEditor() {
        forms.exams?.reset();
        document.getElementById('examModalTitle').textContent = 'Create Exam';
        document.getElementById('cancelExamEditBtn').classList.add('d-none');
        document.getElementById('examSubmitBtn').textContent = 'Save Exam';
    }

    function setRecordEditMode(collection, record) {
        editingRecord = { collection, id: record.id };

        if (collection === 'students') {
            document.getElementById('stuAdNumber').value = record.adNumber || '';
            document.getElementById('stuAdNumber').readOnly = true;
            document.getElementById('stuName').value = record.name || '';
            document.getElementById('stuGender').value = record.gender || 'Male';
            populateClassDropdowns();
            document.getElementById('stuClassSelect').value = record.class || '';
            document.getElementById('stuDivision').value = record.division || '';
            document.getElementById('cancelStudentEditBtn').classList.remove('d-none');
            setButton('studentSubmitBtn', 'Update Student', 'fa-floppy-disk');
        } else if (collection === 'classes') {
            document.getElementById('classGrade').value = record.class || '';
            document.getElementById('classGrade').disabled = true;
            document.getElementById('classDivision').value = record.division || '';
            document.getElementById('classDivision').readOnly = true;
            document.getElementById('classTeacherUser').value = record.username || '';
            document.getElementById('classTeacherPass').value = record.password || '';
            renderClassSubjectCheckboxes();
            document.querySelectorAll('.class-subject-item').forEach(input => {
                input.checked = (record.subjects || []).includes(input.value);
            });
            document.getElementById('cancelClassEditBtn').classList.remove('d-none');
            setButton('classSubmitBtn', 'Update Classroom', 'fa-floppy-disk');
        } else if (collection === 'subjects') {
            document.getElementById('subjectCode').value = record.code || record.id || '';
            document.getElementById('subjectCode').readOnly = true;
            document.getElementById('subjectName').value = record.name || '';
            document.getElementById('cancelSubjectEditBtn').classList.remove('d-none');
            setButton('subjectSubmitBtn', 'Update Subject', 'fa-floppy-disk');
        } else if (collection === 'exams') {
            document.getElementById('newExamName').value = record.name || '';
            document.getElementById('newExamActive').checked = record.active !== false;
            document.getElementById('examModalTitle').textContent = 'Edit Exam';
            document.getElementById('cancelExamEditBtn').classList.remove('d-none');
            document.getElementById('examSubmitBtn').textContent = 'Update Exam';
            bootstrap.Modal.getOrCreateInstance(document.getElementById('newExamModal')).show();
        }
        const modalTitle = {
            students: 'Edit Student',
            classes: 'Edit Classroom',
            subjects: 'Edit Subject'
        }[collection];
        const modalTitleElement = formModals[collection]?.querySelector('.modal-title');
        if (modalTitleElement && modalTitle) modalTitleElement.textContent = modalTitle;
        showFormModal(collection);
    }

    window.openManagementForm = key => {
        if (key === 'bulkUpload') {
            showFormModal(key);
            return;
        }
        if (key === 'academicYear') {
            document.getElementById('academicYearForm').reset();
            showFormModal(key);
            return;
        }
        if (['students', 'classes', 'subjects'].includes(key)) {
            window.cancelRecordEdit(key);
            showFormModal(key);
        }
    };

    window.closeManagementForm = key => hideFormModal(key);

    window.editRecord = async (collection, id) => {
        const panelByCollection = {
            students: 'students',
            classes: 'classes',
            subjects: 'subjects',
            exams: 'exams'
        };
        const panel = panelByCollection[collection];
        if (!panel) return;

        await switchSidebarPanel(panel);
        const record = window.DB_STATE[collection]?.[id];
        if (!record || record.isDeleted) {
            showToast('This record is no longer available.');
            return;
        }

        setRecordEditMode(collection, record);
    };

    window.cancelRecordEdit = collection => {
        if (editingRecord?.collection === collection) editingRecord = null;

        const form = forms[collection];
        form?.reset();

        if (collection === 'students') {
            document.getElementById('stuAdNumber').readOnly = false;
            document.getElementById('cancelStudentEditBtn').classList.add('d-none');
            setButton('studentSubmitBtn', 'Save Student', 'fa-floppy-disk');
        } else if (collection === 'classes') {
            document.getElementById('classGrade').disabled = false;
            document.getElementById('classDivision').readOnly = false;
            document.getElementById('cancelClassEditBtn').classList.add('d-none');
            setButton('classSubmitBtn', 'Save Class Room', 'fa-floppy-disk');
            renderClassSubjectCheckboxes();
        } else if (collection === 'subjects') {
            document.getElementById('subjectCode').readOnly = false;
            document.getElementById('cancelSubjectEditBtn').classList.add('d-none');
            setButton('subjectSubmitBtn', 'Save Subject', 'fa-plus');
        } else if (collection === 'exams') {
            document.getElementById('examModalTitle').textContent = 'Create Exam';
            document.getElementById('cancelExamEditBtn').classList.add('d-none');
            document.getElementById('examSubmitBtn').textContent = 'Save Exam';
            bootstrap.Modal.getOrCreateInstance(document.getElementById('newExamModal')).hide();
        }
        hideFormModal(collection);
        if (formModals[collection]) {
            const title = {
                students: 'Add Student',
                classes: 'Add Classroom',
                subjects: 'Add Subject'
            }[collection];
            if (title) formModals[collection].querySelector('.modal-title').textContent = title;
        }
    };

    async function saveEditedRecord(event, collection) {
        if (editingRecord?.collection !== collection) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const current = window.DB_STATE[collection]?.[editingRecord.id];
        if (!current) {
            showToast('The record could not be found. Refresh and try again.');
            return;
        }

        try {
            let updated = { ...current, lastUpdated: Date.now() };

            if (collection === 'students') {
                updated = {
                    ...updated,
                    name: document.getElementById('stuName').value.trim(),
                    gender: document.getElementById('stuGender').value,
                    class: document.getElementById('stuClassSelect').value.trim(),
                    division: document.getElementById('stuDivision').value.trim().toUpperCase()
                };
            } else if (collection === 'classes') {
                updated = {
                    ...updated,
                    username: document.getElementById('classTeacherUser').value.trim(),
                    password: document.getElementById('classTeacherPass').value.trim(),
                    subjects: [...document.querySelectorAll('.class-subject-item:checked')].map(input => input.value)
                };
            } else if (collection === 'subjects') {
                updated = { ...updated, name: document.getElementById('subjectName').value.trim() };
            } else if (collection === 'exams') {
                updated = {
                    ...updated,
                    name: document.getElementById('newExamName').value.trim(),
                    active: document.getElementById('newExamActive').checked
                };
            }

            await window.pushDocumentToCloud(collection, current.id, updated);
            editingRecord = null;
            cancelFormMode(collection);
            refreshActivePanels();
            const labels = { students: 'Student', classes: 'Classroom', subjects: 'Subject', exams: 'Exam' };
            showToast(`${labels[collection]} updated successfully.`);
        } catch (error) {
            console.error(`Failed to update ${collection} record:`, error);
            showToast(`Could not update ${collection.slice(0, -1)}. Please try again.`);
        }
    }

    function cancelFormMode(collection) {
        const form = forms[collection];
        form?.reset();

        if (collection === 'students') {
            document.getElementById('stuAdNumber').readOnly = false;
            document.getElementById('cancelStudentEditBtn').classList.add('d-none');
            setButton('studentSubmitBtn', 'Save Student', 'fa-floppy-disk');
        } else if (collection === 'classes') {
            document.getElementById('classGrade').disabled = false;
            document.getElementById('classDivision').readOnly = false;
            document.getElementById('cancelClassEditBtn').classList.add('d-none');
            setButton('classSubmitBtn', 'Save Class Room', 'fa-floppy-disk');
            renderClassSubjectCheckboxes();
        } else if (collection === 'subjects') {
            document.getElementById('subjectCode').readOnly = false;
            document.getElementById('cancelSubjectEditBtn').classList.add('d-none');
            setButton('subjectSubmitBtn', 'Save Subject', 'fa-plus');
        } else if (collection === 'exams') {
            resetExamEditor();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('newExamModal')).hide();
        }
        hideFormModal(collection);
    }

    Object.entries(forms).forEach(([collection, form]) => {
        form?.addEventListener('submit', event => saveEditedRecord(event, collection), true);
    });

    document.getElementById('newExamModal')?.addEventListener('hidden.bs.modal', () => {
        if (editingRecord?.collection === 'exams') {
            editingRecord = null;
            resetExamEditor();
        }
    });

    mountFormModals();

    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-open-management-form]');
        if (trigger) window.openManagementForm(trigger.dataset.openManagementForm);
    });

    const scheduleBody = document.getElementById('scheduleTableBody');
    const renderScheduleTab = window.renderScheduleTab;
    if (scheduleBody && typeof renderScheduleTab === 'function') {
        window.renderScheduleTab = function(...args) {
            renderScheduleTab.apply(this, args);
            const isAdmin = window.DB_STATE.currentUser?.role === 'admin';
            const rows = [...scheduleBody.querySelectorAll('tr')];

            rows.forEach(row => {
                const inputs = row.querySelectorAll('.sched-inc, .sched-date, .sched-max, .sched-pass');
                if (!inputs.length) {
                    const emptyCell = row.querySelector('td[colspan]');
                    if (emptyCell) emptyCell.colSpan = 6;
                    return;
                }

                inputs.forEach(input => { input.disabled = !isAdmin; });
                if (!isAdmin) return;

                inputs.forEach(input => { input.disabled = true; });
                const actionCell = document.createElement('td');
                actionCell.className = 'text-end';
                actionCell.innerHTML = `
                    <button type="button" class="btn btn-sm btn-outline-primary" data-schedule-edit title="Edit schedule row" aria-label="Edit schedule row">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                `;
                row.appendChild(actionCell);
            });
        };

        scheduleBody.addEventListener('click', event => {
            const button = event.target.closest('[data-schedule-edit]');
            if (!button) return;

            const row = button.closest('tr');
            const isEditing = button.dataset.editing === 'true';
            row.querySelectorAll('.sched-inc, .sched-date, .sched-max, .sched-pass').forEach(input => {
                input.disabled = isEditing;
            });
            button.dataset.editing = String(!isEditing);
            button.title = isEditing ? 'Edit schedule row' : 'Finish editing row';
            button.innerHTML = `<i class="fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-check'}"></i>`;
        });
    }
})();

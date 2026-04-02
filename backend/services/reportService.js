function parseMarksBlob(blob) {
    const map = {};
    if (!blob) return map;
    String(blob)
        .split('|')
        .forEach((pair) => {
            const idx = pair.indexOf(':');
            if (idx === -1) return;
            const id = pair.slice(0, idx);
            const score = parseInt(pair.slice(idx + 1), 10);
            if (id) map[id] = Number.isFinite(score) ? score : 0;
        });
    return map;
}

function buildRosterStudents(subjectRows, studentRows, summaryRows) {
    const subjects = subjectRows.map((row) => ({
        subject_id: row.subject_id,
        subject_name: row.subject_name,
    }));
    const summaryByStudentId = new Map(
        (summaryRows || []).map((row) => [Number(row.student_id), row])
    );

    const studentsWithCalculations = studentRows.map((student) => {
        const byId = parseMarksBlob(student.marks_blob);
        const marks = {};
        subjects.forEach((sub) => {
            const key = String(sub.subject_id);
            marks[key] = Object.prototype.hasOwnProperty.call(byId, key) ? byId[key] : null;
        });

        const summary = summaryByStudentId.get(Number(student.student_id)) || {};
        const total = Number(summary.total_marks || 0);
        const average = Number(summary.average_marks || 0);
        const status = summary.status || 'FAIL';
        const rank = Number(summary.class_rank || 0);

        return {
            student_id: student.student_id,
            student_name: student.student_name,
            gender: student.gender,
            student_code: student.student_code,
            marks,
            total,
            average: average.toFixed(2),
            status,
            rank,
        };
    });

    studentsWithCalculations.sort((a, b) => a.student_name.localeCompare(b.student_name));

    return { subjects, studentsWithCalculations };
}

function processClassReportStudents(students) {
    return students.map((student) => {
        const marks = {};
        let total = 0;

        if (student.marks_data) {
            student.marks_data.split('|').forEach((mark) => {
                const [subject, score] = mark.split(':');
                const scoreNum = parseInt(score) || 0;
                marks[subject] = scoreNum;
                total += scoreNum;
            });
        }

        const subjectCount = Object.keys(marks).length || 5;
        const average = total / subjectCount;
        const status = average >= 50 ? 'PASS' : 'FAIL';

        return {
            student_id: student.student_id,
            student_name: student.student_name,
            gender: student.gender,
            student_code: student.student_code,
            marks,
            total,
            average: average.toFixed(2),
            status,
        };
    });
}

function rankClassReportStudents(processedStudents) {
    processedStudents.sort((a, b) => b.total - a.total);
    let currentRank = 1;
    processedStudents.forEach((student, index) => {
        if (index > 0 && student.total < processedStudents[index - 1].total) {
            currentRank = index + 1;
        }
        student.rank = currentRank;
    });
    return processedStudents;
}

module.exports = {
    parseMarksBlob,
    buildRosterStudents,
    processClassReportStudents,
    rankClassReportStudents,
};

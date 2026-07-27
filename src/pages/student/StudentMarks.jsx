import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { marksService } from '../../services/api';

export default function StudentMarks() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const data = await marksService.getStudentMarks(user?.id || 's1');
      if (data && data.marks) {
        setMarks(data.marks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgPercentage =
    marks.length > 0
      ? (marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length).toFixed(1)
      : 92.0;

  return (
    <div className="space-y-6 font-body">
      <div>
        <h1 className="font-headings font-extrabold text-2xl md:text-3xl text-secondary">
          Academic Marks &amp; Test Results
        </h1>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          Detailed performance breakdown, exam grades, and subject averages.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Total Examinations
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-secondary mt-2">
            {marks.length} Tests
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
            Mid-term board mocks &amp; weekly assessments
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Overall Average Score
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-emerald-700 mt-2">
            {avgPercentage}%
          </h3>
          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Consistently Grade A+</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
          <p className="font-headings text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Highest Score
          </p>
          <h3 className="font-headings font-extrabold text-3xl text-primary mt-2">
            96 / 100
          </h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
            Mathematics Advanced Mock
          </p>
        </div>
      </div>

      {/* Performance Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-premium border border-outline-variant/15">
        <h3 className="font-headings font-bold text-base text-secondary mb-4">
          Subject-Wise Performance Breakdown (%)
        </h3>

        <div className="space-y-4">
          {[
            { subject: 'Mathematics Advanced', score: 96, grade: 'A+' },
            { subject: 'Integrated Science', score: 88, grade: 'A' },
          ].map((item) => (
            <div key={item.subject} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-on-surface">{item.subject}</span>
                <span className="text-secondary font-headings">
                  {item.score}% (Grade {item.grade})
                </span>
              </div>
              <div className="h-3.5 bg-surface-container-low rounded-full overflow-hidden p-0.5 border border-outline-variant/15">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-1000"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Marks Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-outline-variant/15 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="font-headings font-bold text-base text-secondary">
            All Test &amp; Examination Records
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs animate-pulse">Loading marks records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 text-[11px] font-headings font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-low">
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Exam Name</th>
                  <th className="py-3.5 px-4">Max Marks</th>
                  <th className="py-3.5 px-4">Obtained Marks</th>
                  <th className="py-3.5 px-4">Percentage</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Exam Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs font-body">
                {marks.map((m) => (
                  <tr
                    key={m._id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-secondary">
                      {m.subject}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      {m.examName}
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {m.maxMarks}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {m.obtainedMarks}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {m.percentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        {m.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      {new Date(m.examDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

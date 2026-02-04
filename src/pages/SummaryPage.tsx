import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getShiftSummary } from "../services/api";

interface OperationSummary {
  name: string;
  standardTime: number;
  actualTime: number;
  efficiency: number;
}

interface ShiftResult {
  type: "bonus" | "neutral" | "penalty";
  label: string;
  percent: number;
}

interface ShiftSummaryData {
  totalOperations: number;
  totalWorkingMinutes: number;
  totalStandardMinutes: number;
  efficiencyPercent: number;
  result?: ShiftResult;
  operations?: OperationSummary[];
}

const SummaryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ShiftSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const res = await getShiftSummary();
      setSummary(res.data.data as ShiftSummaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-xl font-bold mb-4">
            Không có dữ liệu ca làm việc
          </h2>
          <button onClick={() => navigate("/")} className="btn-big btn-primary">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const resultColors: Record<string, string> = {
    bonus: "bg-green-500",
    neutral: "bg-yellow-500",
    penalty: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-4 text-center">
        <h1 className="text-xl font-bold">TỔNG KẾT CA LÀM VIỆC</h1>
        <p className="text-blue-200">
          {new Date().toLocaleDateString("vi-VN")}
        </p>
      </header>

      <div className="p-4 space-y-4">
        {/* User Info */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold">{user?.name}</div>
            <div className="text-gray-500">Mã: {user?.code}</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="card">
          <h3 className="font-bold text-lg mb-4 text-center">KẾT QUẢ</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">
                {summary.totalOperations}
              </div>
              <div className="text-sm text-gray-500">Thao tác hoàn thành</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">
                {summary.totalWorkingMinutes}p
              </div>
              <div className="text-sm text-gray-500">Thời gian thực tế</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">
                {summary.totalStandardMinutes}p
              </div>
              <div className="text-sm text-gray-500">Thời gian chuẩn</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div
                className={`text-3xl font-bold ${summary.efficiencyPercent >= 100 ? "text-green-600" : "text-yellow-600"}`}
              >
                {summary.efficiencyPercent}%
              </div>
              <div className="text-sm text-gray-500">Hiệu suất</div>
            </div>
          </div>

          {/* Result */}
          <div
            className={`${resultColors[summary.result?.type || ""] || "bg-gray-500"} text-white rounded-2xl p-6 text-center`}
          >
            <div className="text-2xl mb-2">
              {summary.result?.type === "bonus"
                ? "🎉"
                : summary.result?.type === "penalty"
                  ? "⚠️"
                  : "✅"}
            </div>
            <div className="text-3xl font-bold mb-2">
              {summary.result?.label}
            </div>
            {summary.result?.percent !== 0 && (
              <div className="text-xl">
                {(summary.result?.percent ?? 0) > 0 ? "+" : ""}
                {summary.result?.percent}% lương
              </div>
            )}
          </div>
        </div>

        {/* Operations Detail */}
        <div className="card">
          <h3 className="font-bold text-lg mb-4">Chi tiết thao tác</h3>
          <div className="space-y-2">
            {summary.operations?.map((op, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{op.name}</div>
                  <div className="text-sm text-gray-500">
                    Chuẩn: {op.standardTime}p | TT: {op.actualTime}p
                  </div>
                </div>
                <div
                  className={`font-bold ${op.efficiency >= 100 ? "text-green-600" : "text-yellow-600"}`}
                >
                  {op.efficiency}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="btn-big btn-primary w-full"
          >
            🏠 VỀ TRANG CHÍNH
          </button>
          <button
            onClick={logout}
            className="btn-big bg-gray-500 text-white w-full hover:bg-gray-600"
          >
            🚪 ĐĂNG XUẤT
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;

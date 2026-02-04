import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Spin,
  Empty,
  Alert,
  Tabs,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  RightOutlined,
  ToolOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import * as api from "../../services/api";

const { Title, Text } = Typography;

// Icon mapping for different process types
const getOperationIcon = (processName = "") => {
  const name = processName.toLowerCase();
  if (name.includes("hàn") || name.includes("welding")) return <ToolOutlined />;
  if (name.includes("sơn") || name.includes("paint"))
    return <ExperimentOutlined />;
  if (name.includes("kiểm") || name.includes("qc") || name.includes("quality"))
    return <SafetyOutlined />;
  if (name.includes("điện") || name.includes("electric"))
    return <ThunderboltOutlined />;
  return <BuildOutlined />;
};

const getIconColorClass = (processName = "") => {
  const name = processName.toLowerCase();
  if (name.includes("hàn") || name.includes("welding")) return "welding";
  if (name.includes("sơn") || name.includes("paint")) return "painting";
  if (name.includes("kiểm") || name.includes("qc") || name.includes("quality"))
    return "qc";
  if (name.includes("điện") || name.includes("electric")) return "electrical";
  return "assembly";
};

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState(null);
  const [operations, setOperations] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [todayRegistrations, setTodayRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orderRes, regRes] = await Promise.all([
        api.getCurrentOrderWithOperations(),
        api.getTodayRegistrations(),
      ]);

      if (orderRes.data.data) {
        setActiveOrder(orderRes.data.data.order);
        setProcesses(orderRes.data.data.processes || []);
        setOperations(orderRes.data.data.operations || []);
      }
      setTodayRegistrations(regRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (operationId) => {
    if (registering) return;
    setRegistering(true);
    try {
      await api.registerOperation(operationId);
      message.success("Đăng ký thành công!");
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async (regId) => {
    try {
      await api.cancelRegistration(regId);
      message.success("Đã hủy đăng ký");
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const isRegistered = (opId) => {
    return todayRegistrations.some(
      (r) => r.operationId?._id === opId || r.operationId === opId,
    );
  };

  const pendingRegs = todayRegistrations.filter(
    (r) => r.status !== "completed",
  );
  const completedRegs = todayRegistrations.filter(
    (r) => r.status === "completed",
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Filter tabs for processes
  const processTabItems = [
    { key: "all", label: "Tất cả" },
    ...processes.map((p) => ({
      key: p._id,
      label: p.name,
    })),
  ];

  const filteredOperations = operations.filter(
    (op) => selectedProcess === "all" || op.processId?._id === selectedProcess,
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Production Order Header */}
      {activeOrder ? (
        <div
          className="stitch-card"
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: "var(--primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                ⚡ Lệnh sản xuất
              </Text>
            </div>
            <Title
              level={3}
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {activeOrder.orderCode}
              <Text type="secondary" style={{ fontWeight: 400, fontSize: 18 }}>
                |
              </Text>
              <Text style={{ fontWeight: 400, fontSize: 18 }}>
                {activeOrder.vehicleTypeId?.name}
              </Text>
            </Title>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Mục tiêu
              </Text>
              <div style={{ fontSize: 20, fontWeight: 600 }}>
                {activeOrder.quantity} xe
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Còn lại
              </Text>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                {activeOrder.quantity - (activeOrder.completedQuantity || 0)} xe
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Alert
          message="Không có lệnh sản xuất đang thực hiện"
          description="Vui lòng liên hệ quản lý để được phân công."
          type="warning"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {activeOrder && (
        <>
          {/* Registered Today Section */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                ✅ Đã đăng ký hôm nay
              </Title>
              <Text type="secondary">{todayRegistrations.length} thao tác</Text>
            </div>

            {todayRegistrations.length === 0 ? (
              <div
                className="stitch-card"
                style={{ textAlign: "center", padding: 40 }}
              >
                <Empty description="Chưa đăng ký thao tác nào hôm nay" />
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {todayRegistrations.map((reg) => (
                  <div
                    key={reg._id}
                    className="stitch-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div
                        className={`operation-card-icon ${getIconColorClass(reg.operationId?.processId?.name)}`}
                      >
                        {getOperationIcon(reg.operationId?.processId?.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>
                          {reg.operationId?.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginTop: 4,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            Tiêu chuẩn:{" "}
                            <strong>{reg.expectedQuantity}/ca</strong>
                          </Text>
                          {reg.status === "completed" ? (
                            <span className="badge badge-success">
                              ✓ Hoàn thành
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              ⏱ Đang làm
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {reg.status !== "completed" ? (
                        <>
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() =>
                              navigate(`/worker/complete/${reg._id}`)
                            }
                            style={{ background: "var(--primary)" }}
                          >
                            Nhập kết quả
                          </Button>
                          <Popconfirm
                            title="Hủy đăng ký thao tác này?"
                            onConfirm={() => handleCancelRegistration(reg._id)}
                            okText="Hủy đăng ký"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                          >
                            <Button icon={<DeleteOutlined />} danger />
                          </Popconfirm>
                        </>
                      ) : (
                        <Tag
                          color="success"
                          icon={<CheckCircleOutlined />}
                          style={{ padding: "4px 12px" }}
                        >
                          SL: {reg.actualQuantity}
                        </Tag>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Operations Section */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                ⚙️ Thao tác có thể đăng ký
              </Title>
              <Tabs
                activeKey={selectedProcess}
                onChange={setSelectedProcess}
                items={processTabItems}
                size="small"
                style={{ marginBottom: 0 }}
              />
            </div>

            {filteredOperations.length === 0 ? (
              <div
                className="stitch-card"
                style={{ textAlign: "center", padding: 40 }}
              >
                <Empty description="Không có thao tác khả dụng" />
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {filteredOperations.map((op) => {
                  const registered = isRegistered(op._id);
                  const available = op.isAvailable;
                  const isFull = !available && !registered;

                  return (
                    <div
                      key={op._id}
                      className="operation-card"
                      style={{
                        opacity: isFull ? 0.6 : 1,
                        cursor: isFull ? "not-allowed" : "default",
                      }}
                    >
                      {/* Card Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 16,
                        }}
                      >
                        <div
                          className={`operation-card-icon ${getIconColorClass(op.processId?.name)}`}
                        >
                          {getOperationIcon(op.processId?.name)}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ID: {op.code}
                        </Text>
                      </div>

                      {/* Card Content */}
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 16,
                            marginBottom: 4,
                          }}
                        >
                          {op.name}
                        </div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {op.processId?.name}
                        </Text>
                      </div>

                      {/* Standards */}
                      <div
                        style={{ display: "flex", gap: 24, marginBottom: 16 }}
                      >
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, textTransform: "uppercase" }}
                          >
                            Tiêu chuẩn
                          </Text>
                          <div
                            style={{ fontWeight: 600, color: "var(--primary)" }}
                          >
                            {op.standardQuantity || "—"} sp/ca
                          </div>
                        </div>
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, textTransform: "uppercase" }}
                          >
                            Thời gian
                          </Text>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {op.standardMinutes || "—"} min/sp
                          </div>
                        </div>
                      </div>

                      {/* Slots Info */}
                      <div style={{ marginBottom: 16 }}>
                        {op.allowTeamwork ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <TeamOutlined
                              style={{
                                color: isFull
                                  ? "var(--danger)"
                                  : "var(--text-secondary)",
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: isFull
                                  ? "var(--danger)"
                                  : "var(--text-secondary)",
                              }}
                            >
                              Người làm: {op.currentWorkers}/{op.maxWorkers}{" "}
                              {isFull && "(Đã đủ)"}
                            </Text>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <TeamOutlined
                              style={{ color: "var(--text-secondary)" }}
                            />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              {op.currentWorkers > 0 ? "1/1 (Có người)" : "0/1"}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {registered ? (
                        <Button
                          block
                          disabled
                          icon={<CheckCircleOutlined />}
                          style={{
                            background: "var(--success-light)",
                            borderColor: "var(--success)",
                            color: "var(--success)",
                          }}
                        >
                          Đã đăng ký
                        </Button>
                      ) : available ? (
                        <Button
                          type="primary"
                          block
                          loading={registering}
                          onClick={() => handleRegister(op._id)}
                          icon={<RightOutlined />}
                          style={{ background: "var(--primary)" }}
                        >
                          Đăng ký →
                        </Button>
                      ) : (
                        <Button block disabled>
                          Đã đủ người
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

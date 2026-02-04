import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Progress,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Spin,
  Popconfirm,
  Avatar,
  Breadcrumb,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  FileTextOutlined,
  SyncOutlined,
  WarningOutlined,
  TeamOutlined,
  CalendarOutlined,
  InboxOutlined,
  EyeOutlined,
  ToolOutlined,
  ExperimentOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as api from "../../services/api";

const { Title, Text } = Typography;

// Icon mapping for different process types
const getProcessIcon = (processName = "") => {
  const name = processName.toLowerCase();
  if (
    name.includes("khung") ||
    name.includes("chassis") ||
    name.includes("frame")
  )
    return <BuildOutlined />;
  if (name.includes("sơn") || name.includes("paint"))
    return <ExperimentOutlined />;
  if (name.includes("điện") || name.includes("electric"))
    return <ThunderboltOutlined />;
  if (name.includes("kiểm") || name.includes("qc")) return <SafetyOutlined />;
  return <ToolOutlined />;
};

const getIconColorClass = (processName = "") => {
  const name = processName.toLowerCase();
  if (
    name.includes("khung") ||
    name.includes("chassis") ||
    name.includes("frame")
  )
    return "#7C3AED";
  if (name.includes("sơn") || name.includes("paint")) return "#DB2777";
  if (name.includes("điện") || name.includes("electric")) return "#059669";
  if (name.includes("kiểm") || name.includes("qc")) return "#2563EB";
  return "#D97706";
};

export default function ProductionOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [completionCheck, setCompletionCheck] = useState(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [orderRes, progressRes] = await Promise.all([
        api.getProductionOrder(id),
        api.getOrderProgress(id),
      ]);

      setOrder(orderRes.data.data);
      setProgress(progressRes.data.data.progress);
      setSummary(progressRes.data.data.summary);
    } catch (error) {
      message.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadUsersAndOperations = async () => {
    try {
      const [usersRes, opsRes] = await Promise.all([
        api.getUsers(),
        api.getOperations(),
      ]);
      setUsers(usersRes.data.data);
      setOperations(opsRes.data.data);
    } catch (error) {
      message.error("Lỗi tải danh sách: " + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckCompletion = async () => {
    try {
      const res = await api.checkOrderCompletion(id);
      setCompletionCheck(res.data.data);
      if (res.data.data.canComplete) {
        message.success("Lệnh sản xuất có thể hoàn thành!");
      } else {
        message.warning(
          `Còn ${res.data.data.incompleteProcesses.length} công đoạn chưa hoàn thành`,
        );
      }
    } catch (error) {
      message.error("Lỗi kiểm tra: " + error.message);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      await api.completeOrder(id, { forceComplete: false });
      message.success("Đã hoàn thành lệnh sản xuất!");
      loadData();
    } catch (error) {
      if (error.response?.data?.error?.code === "INCOMPLETE_PROCESSES") {
        Modal.confirm({
          title: "Còn công đoạn chưa hoàn thành",
          content:
            error.response.data.error.message + ". Bạn có muốn ép hoàn thành?",
          okText: "Ép hoàn thành",
          cancelText: "Hủy",
          onOk: async () => {
            await api.completeOrder(id, { forceComplete: true });
            message.success("Đã ép hoàn thành lệnh sản xuất!");
            loadData();
          },
        });
      } else {
        message.error(
          "Lỗi: " + error.response?.data?.error?.message || error.message,
        );
      }
    }
  };

  const handleAssignWorker = async (values) => {
    try {
      setAssignLoading(true);
      await api.assignWorkerToOrder(id, values);
      message.success("Đã bổ sung công nhân!");
      setAssignModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(
        "Lỗi: " + error.response?.data?.error?.message || error.message,
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = () => {
    loadUsersAndOperations();
    setAssignModalVisible(true);
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { className: "badge-gray", text: "Chờ" },
      in_progress: { className: "badge-primary", text: "Đang thực hiện" },
      completed: { className: "badge-success", text: "Hoàn thành" },
    };
    const info = map[status] || { className: "badge-gray", text: status };
    return <span className={`badge ${info.className}`}>{info.text}</span>;
  };

  const columns = [
    {
      title: "CÔNG ĐOẠN",
      key: "stageName",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: `${getIconColorClass(record.processName)}15`,
              color: getIconColorClass(record.processName),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            {getProcessIcon(record.processName)}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{record.processName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bước {record.order}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "TIẾN ĐỘ",
      key: "progress",
      width: 200,
      render: (_, record) => (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 4,
            }}
          >
            <div className="progress-bar" style={{ flex: 1 }}>
              <div
                className={`progress-bar-fill ${record.status === "completed" ? "green" : "blue"}`}
                style={{ width: `${Math.min(record.percentage, 100)}%` }}
              />
            </div>
            <Text style={{ fontSize: 13, minWidth: 50 }}>
              {record.percentage}%
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.completed}/{record.required}
          </Text>
        </div>
      ),
    },
    {
      title: "NGƯỜI PHỤ TRÁCH",
      key: "workers",
      render: (_, record) => {
        if (record.workers.length === 0) {
          return (
            <Text type="secondary">
              <TeamOutlined /> Chưa phân công
            </Text>
          );
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar size="small" style={{ background: "var(--primary)" }}>
              {record.workers[0]?.charAt(0)}
            </Avatar>
            <Text>{record.workers[0]}</Text>
          </div>
        );
      },
    },
    {
      title: "TRẠNG THÁI",
      key: "status",
      render: (_, record) => getStatusBadge(record.status),
    },
    {
      title: "",
      key: "action",
      width: 60,
      align: "center",
      render: () => <Button type="text" icon={<EyeOutlined />} size="small" />,
    },
  ];

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

  const totalWorkers = progress.reduce((sum, p) => sum + p.workers.length, 0);
  const unitsCompleted = progress.reduce((sum, p) => sum + p.completed, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate("/admin/production-orders")}>Sản xuất</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <a onClick={() => navigate("/admin/production-orders")}>
            Lệnh sản xuất
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{order?.orderCode}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Order Header */}
      <div className="stitch-card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <Title level={3} style={{ margin: 0 }}>
                Lệnh #{order?.orderCode}
              </Title>
              {getStatusBadge(order?.status)}
            </div>
            <Text type="secondary">
              {order?.vehicleTypeId?.name} • {order?.vehicleTypeId?.code}
            </Text>
          </div>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/admin/production-orders/${id}/report`)}
          >
            📊 Báo cáo
          </Button>
        </div>

        {/* Overall Progress */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text type="secondary">Tiến độ sản xuất tổng thể</Text>
            <Text
              style={{ fontWeight: 600, color: "var(--primary)", fontSize: 18 }}
            >
              {summary?.overallPercentage || 0}%
            </Text>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className="progress-bar-fill blue"
              style={{ width: `${summary?.overallPercentage || 0}%` }}
            />
          </div>
          <Text
            type="secondary"
            style={{ fontSize: 12, marginTop: 4, display: "block" }}
          >
            Đúng tiến độ cho ngày{" "}
            {dayjs(order?.expectedEndDate).format("DD/MM")}. Không có trễ tiến
            độ.
          </Text>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          <div className="stat-card">
            <div className="stat-card-icon blue">
              <TeamOutlined />
            </div>
            <div className="stat-card-value">{totalWorkers}</div>
            <div
              className="stat-card-label"
              style={{ color: "var(--primary)" }}
            >
              Đủ năng lực
            </div>
            <div className="stat-card-label">Công nhân đang làm</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green">
              <CalendarOutlined />
            </div>
            <div className="stat-card-value">
              {dayjs(order?.expectedEndDate).format("DD/MM")}
            </div>
            <div className="stat-card-label" style={{ fontSize: 11 }}>
              {dayjs(order?.expectedEndDate).format("YYYY")}
            </div>
            <div className="stat-card-label">Dự kiến hoàn thành</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon orange">
              <InboxOutlined />
            </div>
            <div className="stat-card-value">
              {unitsCompleted}{" "}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--text-secondary)",
                }}
              >
                /{order?.quantity}
              </span>
            </div>
            <div
              className="stat-card-label"
              style={{ color: "var(--success)" }}
            >
              +{summary?.overallPercentage || 0}% hiệu suất
            </div>
            <div className="stat-card-label">Sản phẩm hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Process Progress Section */}
      <div className="stitch-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            Tiến độ công đoạn
          </Title>
          <div style={{ display: "flex", gap: 12 }}>
            <Input.Search
              placeholder="Tìm công đoạn..."
              style={{ width: 180 }}
            />
            {order?.status === "in_progress" && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={openAssignModal}
                style={{ background: "var(--primary)" }}
              >
                Bổ sung công nhân
              </Button>
            )}
          </div>
        </div>

        {/* Incomplete Processes Warning */}
        {completionCheck && !completionCheck.canComplete && (
          <div
            style={{
              background: "var(--warning-light)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <WarningOutlined style={{ color: "var(--warning)" }} />
            <Text>
              {completionCheck.incompleteProcesses.length} công đoạn chưa hoàn
              thành:
              {completionCheck.incompleteProcesses.map((p, i) => (
                <span key={i}>
                  {" "}
                  {p.processName} (còn {p.remaining})
                  {i < completionCheck.incompleteProcesses.length - 1
                    ? ","
                    : ""}
                </span>
              ))}
            </Text>
          </div>
        )}

        {/* Progress Table */}
        <Table
          columns={columns}
          dataSource={progress}
          rowKey="processId"
          pagination={false}
          className="stitch-table"
        />

        {/* Action Buttons */}
        {order?.status === "in_progress" && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid var(--border-light)",
            }}
          >
            <Button icon={<SyncOutlined />} onClick={loadData}>
              Làm mới
            </Button>
            <Button icon={<WarningOutlined />} onClick={handleCheckCompletion}>
              Kiểm tra hoàn thành
            </Button>
            <Popconfirm
              title="Xác nhận hoàn thành lệnh sản xuất?"
              onConfirm={handleCompleteOrder}
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ background: "var(--success)" }}
              >
                Hoàn thành lệnh
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>

      {/* Assign Worker Modal */}
      <Modal
        title="Bổ sung công nhân"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleAssignWorker}>
          <Form.Item
            name="userId"
            label="Công nhân"
            rules={[{ required: true, message: "Chọn công nhân" }]}
          >
            <Select
              showSearch
              placeholder="Chọn công nhân..."
              optionFilterProp="children"
            >
              {users
                .filter((u) => u.role === "worker")
                .map((u) => (
                  <Select.Option key={u._id} value={u._id}>
                    {u.code} - {u.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="operationId"
            label="Thao tác"
            rules={[{ required: true, message: "Chọn thao tác" }]}
          >
            <Select
              showSearch
              placeholder="Chọn thao tác..."
              optionFilterProp="children"
            >
              {operations.map((op) => (
                <Select.Option key={op._id} value={op._id}>
                  {op.code} - {op.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="expectedQuantity"
            label="Số lượng dự kiến"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="replacementReason" label="Lý do bổ sung">
            <Input.TextArea
              rows={2}
              placeholder="VD: Công nhân gốc nghỉ ốm..."
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setAssignModalVisible(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={assignLoading}
                style={{ background: "var(--primary)" }}
              >
                Bổ sung
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

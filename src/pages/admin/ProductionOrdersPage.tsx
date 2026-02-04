import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tag,
  Space,
  message,
  Popconfirm,
  Typography,
  Card,
  List,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ExpandOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as api from "../../services/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ProductionOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, vtRes] = await Promise.all([
        api.getProductionOrders(),
        api.getVehicleTypes({ active: true }),
      ]);
      setOrders(ordersRes.data.data || []);
      setVehicleTypes(vtRes.data.data || []);
    } catch {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        startDate: values.startDate?.format("YYYY-MM-DD"),
        expectedEndDate: values.expectedEndDate?.format("YYYY-MM-DD"),
        frameNumbers: values.frameNumbers
          ? values.frameNumbers.split("\n").filter(Boolean)
          : [],
        engineNumbers: values.engineNumbers
          ? values.engineNumbers.split("\n").filter(Boolean)
          : [],
      };
      await api.createProductionOrder(data);
      message.success("Tạo lệnh thành công");
      setModalOpen(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateProductionOrderStatus(id, status);
      message.success("Cập nhật thành công");
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProductionOrder(id);
      message.success("Xóa thành công");
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error?.message || "Có lỗi xảy ra");
    }
  };

  const getStatusTag = (status) => {
    const config = {
      pending: { color: "gold", label: "Chờ" },
      in_progress: { color: "blue", label: "Đang thực hiện" },
      completed: { color: "green", label: "Hoàn thành" },
      cancelled: { color: "red", label: "Đã hủy" },
    };
    const { color, label } = config[status] || {
      color: "default",
      label: status,
    };
    return <Tag color={color}>{label}</Tag>;
  };

  // Mobile Card View
  const MobileView = () => (
    <List
      dataSource={orders}
      loading={loading}
      renderItem={(order) => (
        <Card size="small" style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {order.orderCode}
              </Text>
              <div style={{ fontSize: 13 }}>
                {order.vehicleTypeId?.code} - {order.vehicleTypeId?.name}
              </div>
            </div>
            {getStatusTag(order.status)}
          </div>

          <Row gutter={8} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <Text type="secondary">SL:</Text>{" "}
              <strong>{order.quantity}</strong>
            </Col>
            <Col span={12}>
              <Text type="secondary">Bắt đầu:</Text>{" "}
              {dayjs(order.startDate).format("DD/MM")}
            </Col>
          </Row>

          <Space wrap>
            {order.status === "pending" && (
              <Button
                size="small"
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStatusChange(order._id, "in_progress")}
              >
                Bắt đầu
              </Button>
            )}
            {order.status === "in_progress" && (
              <Button
                size="small"
                style={{
                  background: "#52c41a",
                  borderColor: "#52c41a",
                  color: "white",
                }}
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusChange(order._id, "completed")}
              >
                Hoàn thành
              </Button>
            )}
            <Button
              size="small"
              icon={<ExpandOutlined />}
              onClick={() => setDetailModal(order)}
            >
              Chi tiết
            </Button>
            {order.status !== "in_progress" && order.status !== "completed" && (
              <Popconfirm
                title="Xóa?"
                onConfirm={() => handleDelete(order._id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Card>
      )}
    />
  );

  const columns = [
    {
      title: "Mã lệnh",
      dataIndex: "orderCode",
      key: "orderCode",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Loại xe",
      dataIndex: "vehicleTypeId",
      key: "vehicleType",
      render: (vt) => (vt ? `${vt.code}` : "-"),
    },
    { title: "SL", dataIndex: "quantity", key: "quantity", align: "center" },
    {
      title: "Ngày",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => dayjs(date).format("DD/MM"),
    },
    {
      title: "TT",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/production-orders/${record._id}`)}
          />
          {record.status === "pending" && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleStatusChange(record._id, "in_progress")}
            >
              ▶
            </Button>
          )}
          {record.status === "in_progress" && (
            <Button
              size="small"
              style={{ background: "#52c41a", color: "white" }}
              onClick={() => handleStatusChange(record._id, "completed")}
            >
              ✓
            </Button>
          )}
          {record.status !== "in_progress" && record.status !== "completed" && (
            <Popconfirm
              title="Xóa?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>
                X
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          📋 Lệnh Sản Xuất
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Tạo
        </Button>
      </div>

      {isMobile ? (
        <MobileView />
      ) : (
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      )}

      {/* Detail Modal for Mobile */}
      <Modal
        title={`Chi tiết: ${detailModal?.orderCode}`}
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={<Button onClick={() => setDetailModal(null)}>Đóng</Button>}
      >
        {detailModal && (
          <div>
            <p>
              <Text type="secondary">Loại xe:</Text>{" "}
              {detailModal.vehicleTypeId?.name}
            </p>
            <p>
              <Text type="secondary">Số lượng:</Text> {detailModal.quantity}
            </p>
            <p>
              <Text type="secondary">Ngày bắt đầu:</Text>{" "}
              {dayjs(detailModal.startDate).format("DD/MM/YYYY")}
            </p>
            <p>
              <Text type="secondary">Dự kiến:</Text>{" "}
              {detailModal.expectedEndDate
                ? dayjs(detailModal.expectedEndDate).format("DD/MM/YYYY")
                : "-"}
            </p>
            <p>
              <Text type="secondary">
                Số khung ({detailModal.frameNumbers?.length || 0}):
              </Text>
            </p>
            <p style={{ fontFamily: "monospace", fontSize: 11 }}>
              {detailModal.frameNumbers?.join(", ") || "-"}
            </p>
            <p>
              <Text type="secondary">
                Số động cơ ({detailModal.engineNumbers?.length || 0}):
              </Text>
            </p>
            <p style={{ fontFamily: "monospace", fontSize: 11 }}>
              {detailModal.engineNumbers?.join(", ") || "-"}
            </p>
            {detailModal.note && (
              <p>
                <Text type="secondary">Ghi chú:</Text> {detailModal.note}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        title="Tạo Lệnh Sản Xuất"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="vehicleTypeId"
            label="Loại xe"
            rules={[{ required: true, message: "Chọn loại xe" }]}
          >
            <Select placeholder="-- Chọn --">
              {vehicleTypes.map((vt) => (
                <Select.Option key={vt._id} value={vt._id}>
                  {vt.code} - {vt.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Bắt đầu"
                rules={[{ required: true }]}
                initialValue={dayjs()}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedEndDate" label="Dự kiến">
                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="frameNumbers" label="Số khung (mỗi dòng 1 số)">
            <TextArea rows={2} placeholder={"XDD-A1-001\nXDD-A1-002"} />
          </Form.Item>
          <Form.Item name="engineNumbers" label="Số động cơ (mỗi dòng 1 số)">
            <TextArea rows={2} placeholder={"DC-A1-001\nDC-A1-002"} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Tạo
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
